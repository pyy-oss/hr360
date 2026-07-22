import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertDeptManagerOrHR } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  id: z.string().min(1),
  status: z.enum(['inscrit', 'en_cours', 'termine', 'certifie', 'abandonne']),
});

/** Met à jour le statut d'une inscription (manager du département ou RH). Auditée. */
export const updateEnrollment = onCall(async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Mise à jour invalide.');
  const { id, status } = p.data;
  const ref = db.doc(`enrollments/${id}`);

  const before = await ref.get();
  if (!before.exists) throw new HttpsError('not-found', 'Inscription introuvable.');
  const c = assertDeptManagerOrHR(req, before.get('departmentId'));

  const patch: Record<string, unknown> = { status, updatedAt: FieldValue.serverTimestamp() };
  if (status === 'en_cours') patch.startedAt = FieldValue.serverTimestamp();
  if (['termine', 'certifie'].includes(status)) patch.completedAt = FieldValue.serverTimestamp();
  await ref.update(patch);

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'update_enrollment', resource: 'enrollments', resourceId: id,
    before: { status: before.get('status') }, after: { status },
  });
  return { ok: true };
});
