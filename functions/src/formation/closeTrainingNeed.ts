import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertDeptManagerOrHR } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({
  id: z.string().min(1),
  status: z.enum(['planifie', 'clos']),
});

/** Fait évoluer un besoin de formation (manager du département ou RH). Auditée. */
export const closeTrainingNeed = onCall(async (req) => {
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Requête invalide.');
  const { id, status } = p.data;
  const ref = db.doc(`trainingNeeds/${id}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Besoin introuvable.');
  const c = assertDeptManagerOrHR(req, snap.get('departmentId'));

  await ref.update({ status, updatedAt: FieldValue.serverTimestamp() });
  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'update_training_need', resource: 'trainingNeeds', resourceId: id,
    before: { status: snap.get('status') }, after: { status },
  });
  return { ok: true };
});
