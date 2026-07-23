import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertDeptManagerOrHR, assertSameOrg } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  evaluationId: z.string().min(1),
  managerAssessment: z.string().min(1).max(2000),
  rating: z.number().int().min(1).max(5),
});

/**
 * Le manager (ou RH/DRH) rédige l'évaluation et la soumet : en_cours → soumise.
 * La publication (soumise → publiee) reste l'affaire de publishEvaluation. Audit.
 */
export const submitEvaluation = onCall(async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Requête invalide.');
  const { evaluationId, managerAssessment, rating } = p.data;

  const ref = db.doc(`evaluations/${evaluationId}`);
  const c = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Évaluation introuvable.');
    const claims = assertDeptManagerOrHR(req, snap.get('departmentId'));
    assertSameOrg(claims, snap.get('orgId'));
    if (snap.get('status') !== 'en_cours') {
      throw new HttpsError('failed-precondition', 'Seule une évaluation en cours peut être soumise.');
    }
    tx.update(ref, {
      managerAssessment, rating, status: 'soumise', updatedAt: FieldValue.serverTimestamp(),
    });
    return claims;
  });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'submit_evaluation', resource: 'evaluations', resourceId: evaluationId,
    before: { status: 'en_cours' }, after: { status: 'soumise', rating },
  });
  return { ok: true };
});
