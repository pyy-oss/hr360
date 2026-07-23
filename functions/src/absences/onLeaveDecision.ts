import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { db } from '../lib/admin';
import { notify } from '../lib/notify';

/** Notifie le collaborateur quand sa demande passe à approuve/refuse. Idempotent. */
export const onLeaveDecision = onDocumentUpdated('leaveRequests/{id}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (before.status === after.status) return;
  if (!['approuve', 'refuse'].includes(after.status)) return;

  const empSnap = await db.doc(`employees/${after.employeeId}`).get();
  const toUid = empSnap.get('uid');
  if (!toUid) return;

  await notify({
    id: `leave_${event.params.id}_${after.status}`, // déterministe => idempotent
    orgId: after.orgId, toUid, type: 'leave_decision',
    payload: { requestId: event.params.id, status: after.status },
  });
});
