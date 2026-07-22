import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertDeptManagerOrHR } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({ objectiveId: z.string().min(1) });

/**
 * Valide un objectif proposé par le collaborateur (brouillon → valide).
 * Réservé au manager du département (ou RH/DRH). Audit.
 */
export const validateObjective = onCall(async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Requête invalide.');
  const ref = db.doc(`objectives/${p.data.objectiveId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Objectif introuvable.');
  if (snap.get('status') !== 'brouillon') {
    throw new HttpsError('failed-precondition', 'Seul un objectif en brouillon peut être validé.');
  }
  const c = assertDeptManagerOrHR(req, snap.get('departmentId'));

  await ref.update({ status: 'valide', updatedAt: FieldValue.serverTimestamp() });
  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'validate_objective', resource: 'objectives', resourceId: p.data.objectiveId,
    before: { status: 'brouillon' }, after: { status: 'valide' },
  });
  return { ok: true };
});
