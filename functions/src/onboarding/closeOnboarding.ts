import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole, assertSameOrg } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({ id: z.string().min(1) });

/**
 * Clôture un parcours d'intégration : exige que TOUTES les tâches soient faites et
 * passe le statut à 'termine'. Le collaborateur reste en période d'essai — la
 * confirmation est une décision distincte (decideProbation). Réservé RH/DRH. Audit.
 */
export const closeOnboarding = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Requête invalide.');
  const ref = db.doc(`onboardings/${p.data.id}`);

  const employeeId = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Intégration introuvable.');
    assertSameOrg(c, snap.get('orgId'));
    if (snap.get('status') !== 'en_cours') {
      throw new HttpsError('failed-precondition', 'Intégration déjà clôturée.');
    }
    const tasks = (snap.get('tasks') as { done: boolean }[]) ?? [];
    if (!tasks.every((t) => t.done)) {
      throw new HttpsError('failed-precondition', 'Toutes les tâches doivent être faites avant la clôture.');
    }
    tx.update(ref, { status: 'termine', closedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return snap.get('employeeId') as string;
  });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'close_onboarding', resource: 'onboardings', resourceId: p.data.id,
    after: { status: 'termine', employeeId },
  });
  return { ok: true };
});
