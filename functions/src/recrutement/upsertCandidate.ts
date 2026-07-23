import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertSameOrg, getClaims, inDeptScope, Claims } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';
import { CallableRequest } from 'firebase-functions/v2/https';

const Schema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  source: z.enum(['spontanee', 'site', 'cooptation', 'linkedin', 'cabinet', 'autre']),
  positionId: z.string().optional(),
  departmentId: z.string().optional(),
  yearsExperience: z.number().min(0).max(60).default(0),
  stage: z.enum(['nouveau', 'preselection', 'entretien', 'offre', 'embauche', 'rejete', 'vivier']).default('nouveau'),
  matchScore: z.number().int().min(0).max(100).optional(),
  tags: z.array(z.string().min(1)).max(20).default([]),
  notes: z.string().max(2000).optional(),
});

/** Recruteur : RH/DRH/admin, ou manager du département cible (si renseigné). */
function assertRecruiter(req: CallableRequest, departmentId?: string): Claims {
  const c = getClaims(req);
  const isHR = ['super_admin', 'drh', 'rh', 'recruteur'].includes(c.role);
  const isMgr = c.role === 'manager' && !!departmentId && inDeptScope(c, departmentId);
  if (!isHR && !isMgr) {
    throw new HttpsError('permission-denied', 'Réservé au recrutement ou au manager du département.');
  }
  return c;
}

/** Crée ou met à jour un candidat (données personnelles — accès recruteur). Audit ARTCI. */
export const upsertCandidate = onCall(async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Candidat invalide.');
  const { id, ...data } = p.data;

  const ref = id ? db.doc(`candidates/${id}`) : db.collection('candidates').doc();
  let c: Claims;
  if (id) {
    const existing = await ref.get();
    if (!existing.exists) throw new HttpsError('not-found', 'Candidat introuvable.');
    // Droits fondés sur le département EXISTANT du candidat.
    c = assertRecruiter(req, existing.get('departmentId'));
    assertSameOrg(c, existing.get('orgId'));
  } else {
    c = assertRecruiter(req, data.departmentId);
  }

  const payload: Record<string, unknown> = { orgId: c.orgId, ...data, updatedAt: FieldValue.serverTimestamp() };
  if (!id) { payload.createdAt = FieldValue.serverTimestamp(); payload.appliedAt = FieldValue.serverTimestamp(); }
  await ref.set(payload, { merge: true });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: id ? 'update_candidate' : 'create_candidate', resource: 'candidates', resourceId: ref.id,
    // Minimisation : on ne journalise pas l'email/téléphone, seulement l'identité de suivi.
    after: { name: `${data.firstName} ${data.lastName}`, stage: data.stage, source: data.source },
  });
  return { ok: true, id: ref.id };
});
