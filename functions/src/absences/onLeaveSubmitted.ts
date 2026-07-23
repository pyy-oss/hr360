import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { db } from '../lib/admin';
import { notify } from '../lib/notify';

/**
 * À la soumission d'une demande de congé, notifie le manager du collaborateur
 * qu'une validation est en attente. Idempotent (id déterministe). Silencieux si
 * le collaborateur n'a pas de manager rattaché.
 */
export const onLeaveSubmitted = onDocumentCreated('leaveRequests/{id}', async (event) => {
  const data = event.data?.data();
  if (!data || data.status !== 'soumis') return;

  const empSnap = await db.doc(`employees/${data.employeeId}`).get();
  const managerUid = empSnap.get('managerUid');
  if (!managerUid) return;

  await notify({
    id: `leave_pending_${event.params.id}`,
    orgId: data.orgId, toUid: managerUid, type: 'leave_pending',
    payload: { requestId: event.params.id, employeeId: data.employeeId, days: data.days ?? null },
  });
});
