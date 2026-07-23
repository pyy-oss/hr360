import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole, assertSameOrg } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  employeeId: z.string().min(1),
  outcome: z.enum(['confirme', 'non_confirme']),
  note: z.string().max(1000).optional(),
});

/**
 * Décision de fin de période d'essai (RH/DRH). Le collaborateur doit être en 'essai'.
 * - 'confirme'      → dossier basculé en 'confirme'.
 * - 'non_confirme'  → dossier basculé en 'sortant' (l'offboarding peut suivre).
 * Transaction (relecture du statut) + audit avant/après.
 */
export const decideProbation = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Données invalides.');
  const { employeeId, outcome, note } = p.data;
  const ref = db.doc(`employees/${employeeId}`);

  const before = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Collaborateur introuvable.');
    assertSameOrg(c, snap.get('orgId'));
    const status = snap.get('status') as string;
    if (status !== 'essai') {
      throw new HttpsError('failed-precondition', "Le collaborateur n'est pas en période d'essai.");
    }
    const newStatus = outcome === 'confirme' ? 'confirme' : 'sortant';
    tx.update(ref, { status: newStatus, updatedAt: FieldValue.serverTimestamp() });
    return status;
  });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'decide_probation', resource: 'employees', resourceId: employeeId,
    before: { status: before },
    after: { status: outcome === 'confirme' ? 'confirme' : 'sortant', outcome, note: note ?? null },
  });
  return { ok: true, outcome };
});
