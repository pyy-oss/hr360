import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { auth, db } from '../lib/admin';
import { assertRole, assertSameOrg } from '../lib/rbac';
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
  // Le dossier doit appartenir à l'organisation de l'acteur.
  assertSameOrg(c, emp.get('orgId'));

  // Anti-capture cross-org : le compte lié ne doit pas déjà appartenir à une autre org.
  const target = await auth.getUser(uid).catch(() => null);
  const targetOrg = (target?.customClaims as { orgId?: string } | undefined)?.orgId;
  if (targetOrg && targetOrg !== c.orgId) {
    throw new HttpsError('permission-denied', "Ce compte appartient à une autre organisation.");
  }

  await empRef.update({ uid, updatedAt: FieldValue.serverTimestamp() });
  await db.doc(`users/${uid}`).set({ employeeId, orgId: c.orgId }, { merge: true });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: c },
    action: 'link_employee_account', resource: 'employees', resourceId: employeeId,
    after: { uid },
  });
  return { ok: true };
});
