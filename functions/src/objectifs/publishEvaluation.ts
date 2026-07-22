import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertDeptManagerOrHR } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({ evaluationId: z.string().min(1) });

/**
 * Publie une évaluation → devient visible au collaborateur (status 'publiee').
 * Réservé manager du département (ou RH/DRH). L'évaluation doit être 'soumise'. Audit.
 */
export const publishEvaluation = onCall(async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Requête invalide.');
  const ref = db.doc(`evaluations/${p.data.evaluationId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Évaluation introuvable.');
  if (snap.get('status') !== 'soumise') {
    throw new HttpsError('failed-precondition', "L'évaluation doit être soumise avant publication.");
  }
  const c = assertDeptManagerOrHR(req, snap.get('departmentId'));

  await ref.update({ status: 'publiee', publishedAt: FieldValue.serverTimestamp() });
  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'publish_evaluation', resource: 'evaluations', resourceId: p.data.evaluationId,
    before: { status: 'soumise' }, after: { status: 'publiee' },
  });
  return { ok: true };
});
