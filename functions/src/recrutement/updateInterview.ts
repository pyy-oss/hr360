import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { getClaims, assertSameOrg, inDeptScope, Claims } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  id: z.string().min(1),
  scheduledAt: z.string().min(1).optional(),
  mode: z.enum(['visio', 'present', 'tel']).optional(),
  status: z.enum(['planifie', 'realise', 'annule', 'no_show']).optional(),
  notes: z.string().max(1000).optional(),
});

function assertRecruiter(req: CallableRequest, departmentId?: unknown): Claims {
  const c = getClaims(req);
  const isHR = ['super_admin', 'drh', 'rh', 'recruteur'].includes(c.role);
  const isMgr = c.role === 'manager' && !!departmentId && inDeptScope(c, departmentId as string);
  if (!isHR && !isMgr) throw new HttpsError('permission-denied', 'Réservé au recrutement ou au manager du département.');
  return c;
}

/**
 * Met à jour un entretien : reprogrammation, mode, statut (réalisé/annulé/absence),
 * notes. Réservé recrutement / manager du département. Audit avant/après.
 */
export const updateInterview = onCall(async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', p.error.issues[0]?.message ?? 'Données invalides.');
  const ref = db.doc(`interviews/${p.data.id}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Entretien introuvable.');
  const c = assertRecruiter(req, snap.get('departmentId'));
  assertSameOrg(c, snap.get('orgId'));

  const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (p.data.scheduledAt !== undefined) patch.scheduledAt = p.data.scheduledAt;
  if (p.data.mode !== undefined) patch.mode = p.data.mode;
  if (p.data.status !== undefined) patch.status = p.data.status;
  if (p.data.notes !== undefined) patch.notes = p.data.notes;
  await ref.update(patch);

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'update_interview', resource: 'interviews', resourceId: p.data.id,
    before: { status: snap.get('status'), scheduledAt: snap.get('scheduledAt') },
    after: { status: p.data.status ?? snap.get('status'), scheduledAt: p.data.scheduledAt ?? snap.get('scheduledAt') },
  });
  return { ok: true };
});
