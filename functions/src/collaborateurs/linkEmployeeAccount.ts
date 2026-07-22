import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../lib/admin';
import { assertRole } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import { FieldValue } from 'firebase-admin/firestore';

const Schema = z.object({ employeeId: z.string().min(1), uid: z.string().min(1) });

/**
 * Relie un dossier collaborateur à un compte Auth (uid). Réservé RH/DRH.
 * Reflète le lien côté users pour l'affichage. Audit.
 */
export const linkEmployeeAccount = onCall(async (req) => {
  const c = assertRole(req, ['super_admin', 'drh', 'rh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Requête invalide.');
  const { employeeId, uid } = p.data;

  const empRef = db.doc(`employees/${employeeId}`);
  const emp = await empRef.get();
  if (!emp.exists) throw new HttpsError('not-found', 'Collaborateur introuvable.');

  await empRef.update({ uid, updatedAt: FieldValue.serverTimestamp() });
  await db.doc(`users/${uid}`).set({ employeeId, orgId: c.orgId }, { merge: true });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'link_employee_account', resource: 'employees', resourceId: employeeId,
    after: { uid },
  });
  return { ok: true };
});
