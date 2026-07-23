import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { getClaims, assertSameOrg, Claims } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  id: z.string().optional(),
  campaignId: z.string().min(1),
  employeeId: z.string().min(1),
  departmentId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().max(1000).optional(),
  measure: z.string().min(1),
  weight: z.number().int().min(0).max(100),
});

/**
 * Autorisé si : RH/DRH/admin, OU manager du département, OU le collaborateur
 * lui-même pour SON objectif (proposition en brouillon).
 */
function assertMayEditObjective(req: CallableRequest, departmentId: string, employeeId: string): Claims {
  const c = getClaims(req);
  const isHR = ['super_admin', 'drh', 'rh'].includes(c.role);
  const isMgr = c.role === 'manager' && c.departmentId === departmentId;
  const isSelf = c.employeeId === employeeId;
  if (!isHR && !isMgr && !isSelf) {
    throw new HttpsError('permission-denied', "Droits insuffisants sur cet objectif.");
  }
  return c;
}

/**
 * Crée ou met à jour un objectif en BROUILLON. La validation (brouillon → valide)
 * passe par validateObjective ; on interdit ici toute modification d'un objectif
 * déjà validé. Audit.
 */
export const upsertObjective = onCall(async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Objectif invalide.');
  const { id, ...data } = p.data;

  const ref = id ? db.doc(`objectives/${id}`) : db.collection('objectives').doc();
  let c: Claims;
  if (id) {
    const existing = await ref.get();
    if (!existing.exists) throw new HttpsError('not-found', 'Objectif introuvable.');
    // Droits fondés sur le document EXISTANT.
    c = assertMayEditObjective(req, existing.get('departmentId'), existing.get('employeeId'));
    assertSameOrg(c, existing.get('orgId'));
    if (existing.get('status') !== 'brouillon') {
      throw new HttpsError('failed-precondition', 'Seul un objectif en brouillon est modifiable.');
    }
  } else {
    c = assertMayEditObjective(req, data.departmentId, data.employeeId);
  }

  const payload: Record<string, unknown> = { orgId: c.orgId, ...data, status: 'brouillon', updatedAt: FieldValue.serverTimestamp() };
  if (!id) payload.createdAt = FieldValue.serverTimestamp();
  await ref.set(payload, { merge: true });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: id ? 'update_objective' : 'create_objective', resource: 'objectives', resourceId: ref.id,
    after: { title: data.title, weight: data.weight, employeeId: data.employeeId },
  });
  return { ok: true, id: ref.id };
});
