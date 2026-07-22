import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { db } from '../lib/admin';
import { FieldValue } from 'firebase-admin/firestore';

/** Notifie le collaborateur quand sa demande passe à approuve/refuse. Idempotent. */
export const onLeaveDecision = onDocumentUpdated('leaveRequests/{id}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (before.status === after.status) return;
  if (!['approuve', 'refuse'].includes(after.status)) return;

  const notifId = `leave_${event.params.id}_${after.status}`;
  const ref = db.doc(`notifications/${notifId}`); // id déterministe => idempotent
  const exists = await ref.get();
  if (exists.exists) return;

  const empSnap = await db.doc(`employees/${after.employeeId}`).get();
  const toUid = empSnap.get('uid');
  if (!toUid) return;

  await ref.set({
    orgId: after.orgId, toUid, type: 'leave_decision',
    payload: { requestId: event.params.id, status: after.status },
    read: false, createdAt: FieldValue.serverTimestamp(),
  });
});
