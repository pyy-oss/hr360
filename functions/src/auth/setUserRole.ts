import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { auth, db } from '../lib/admin';
import { assertRole } from '../lib/rbac';
import { writeAudit } from '../lib/audit';

const Schema = z.object({
  uid: z.string().min(1),
  role: z.enum(['super_admin', 'drh', 'rh', 'manager', 'collaborateur', 'lecture']),
  departmentId: z.string().optional(),
  employeeId: z.string().optional(),
});

/**
 * Pose le rôle et le rattachement dans les custom claims (autorité RBAC).
 * Réservé super_admin / drh. Le client doit rafraîchir son token après (getIdToken(true)).
 */
export const setUserRole = onCall(async (req) => {
  const actor = assertRole(req, ['super_admin', 'drh']);
  const p = Schema.safeParse(req.data);
  if (!p.success) throw new HttpsError('invalid-argument', 'Données invalides.');
  const { uid, role, departmentId, employeeId } = p.data;

  await auth.setCustomUserClaims(uid, { role, orgId: actor.orgId, departmentId, employeeId });
  // Reflet pour l'affichage (ne fait pas autorité).
  await db.doc(`users/${uid}`).set({ role, departmentId: departmentId ?? null }, { merge: true });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: actor },
    action: 'set_role', resource: 'users', resourceId: uid, after: { role, departmentId },
  });
  return { ok: true };
});
