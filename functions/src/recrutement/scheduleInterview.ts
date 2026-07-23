import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { getClaims, assertSameOrg, inDeptScope, Claims } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  candidateId: z.string().min(1),
  positionId: z.string().optional(),
  scheduledAt: z.string().min(1),
  mode: z.enum(['visio', 'present', 'tel']),
  interviewers: z.array(z.string().min(1)).max(10).optional(),
  notes: z.string().max(1000).optional(),
});

/** Recrutement : RH/DRH/admin/recruteur, ou manager du département du candidat. */
function assertRecruiter(req: CallableRequest, departmentId?: unknown): Claims {
  const c = getClaims(req);
  const isHR = ['super_admin', 'drh', 'rh', 'recruteur'].includes(c.role);
  const isMgr = c.role === 'manager' && !!departmentId && inDeptScope(c, departmentId as string);
  if (!isHR && !isMgr) throw new HttpsError('permission-denied', 'Réservé au recrutement ou au manager du département.');
  return c;
}

/**
 * Planifie un entretien pour un candidat. Réservé recrutement / manager du
 * département cible. Le département est dénormalisé pour le contrôle d'accès. Audit.
 */
export const scheduleInterview = onCall(async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Données invalides.');

  const cand = await db.doc(`candidates/${p.data.candidateId}`).get();
  if (!cand.exists) throw new HttpsError('not-found', 'Candidat introuvable.');
  const departmentId = cand.get('departmentId');
  const c = assertRecruiter(req, departmentId);
  assertSameOrg(c, cand.get('orgId'));

  const ref = db.collection('interviews').doc();
  await ref.set({
    orgId: c.orgId, candidateId: p.data.candidateId, positionId: p.data.positionId ?? null,
    departmentId: departmentId ?? null,
    scheduledAt: p.data.scheduledAt, mode: p.data.mode,
    interviewers: p.data.interviewers ?? [], notes: p.data.notes ?? '',
    status: 'planifie',
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'schedule_interview', resource: 'interviews', resourceId: ref.id,
    after: { candidateId: p.data.candidateId, scheduledAt: p.data.scheduledAt, mode: p.data.mode },
  });
  return { ok: true, id: ref.id };
});
