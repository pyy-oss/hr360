import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole, assertSameOrg } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({ id: z.string().min(1) });

/**
 * Clôture un offboarding : exige que TOUTES les tâches soient faites, passe le
 * statut à 'cloture' et bascule le collaborateur en 'sortant'. Réservé RH/DRH.
 * Transaction (offboarding + employé). Audit.
 */
export const closeOffboarding = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Requête invalide.');
  const ref = db.doc(`offboardings/${p.data.id}`);

  const employeeId = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Offboarding introuvable.');
    assertSameOrg(c, snap.get('orgId'));
    if (snap.get('status') !== 'en_cours') {
      throw new HttpsError('failed-precondition', 'Offboarding déjà clôturé.');
    }
    const tasks = (snap.get('tasks') as { done: boolean }[]) ?? [];
    if (!tasks.every((t) => t.done)) {
      throw new HttpsError('failed-precondition', 'Toutes les tâches doivent être faites avant la clôture.');
    }
    const empId = snap.get('employeeId') as string;
    tx.update(ref, { status: 'cloture', closedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    // Bascule le dossier salarié en « sortant ».
    tx.set(db.doc(`employees/${empId}`), { status: 'sortant', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return empId;
  });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'close_offboarding', resource: 'offboardings', resourceId: p.data.id,
    after: { status: 'cloture', employeeId },
  });
  return { ok: true };
});
