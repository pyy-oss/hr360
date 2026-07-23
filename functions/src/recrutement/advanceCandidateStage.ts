import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { getClaims, assertSameOrg, inDeptScope, Claims } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const STAGES = ['nouveau', 'preselection', 'entretien', 'offre', 'embauche', 'rejete', 'vivier'] as const;
const Schema = z.object({
  id: z.string().min(1),
  stage: z.enum(STAGES),
  comment: z.string().max(500).optional(),
});

function assertRecruiter(req: CallableRequest, departmentId?: unknown): Claims {
  const c = getClaims(req);
  const isHR = ['super_admin', 'drh', 'rh', 'recruteur'].includes(c.role);
  const isMgr = c.role === 'manager' && !!departmentId && inDeptScope(c, departmentId as string);
  if (!isHR && !isMgr) {
    throw new HttpsError('permission-denied', 'Réservé au recrutement ou au manager du département.');
  }
  return c;
}

/**
 * Fait avancer un candidat dans le pipeline de recrutement. Transactionnel + audité.
 * Le statut 'embauche' est terminal côté vivier : la suite passe par le dossier salarié.
 */
export const advanceCandidateStage = onCall(async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Transition invalide.');
  const { id, stage, comment } = p.data;

  const ref = db.doc(`candidates/${id}`);
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Candidat introuvable.');
    const c = assertRecruiter(req, snap.get('departmentId'));
    assertSameOrg(c, snap.get('orgId'));

    const from = snap.get('stage') as string;
    if (from === 'embauche') {
      throw new HttpsError('failed-precondition', 'Candidat déjà embauché — transition impossible.');
    }
    if (from === stage) return { c, from };

    tx.update(ref, {
      stage,
      lastStageComment: comment ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { c, from };
  });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: result.c },
    action: 'advance_candidate_stage', resource: 'candidates', resourceId: id,
    before: { stage: result.from }, after: { stage, comment: comment ?? null },
  });
  return { ok: true, id, stage };
});
