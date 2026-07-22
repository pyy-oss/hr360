import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { auth, db } from '../lib/admin';
import { assertRole } from '../lib/rbac';
import { writeAudit } from '../lib/audit';
import type { Role } from '../lib/rbac';

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

  // Anti-escalade : on ne délègue jamais au-dessus de son niveau.
  // Seul un super_admin peut attribuer le rôle super_admin.
  if (role === 'super_admin' && actor.role !== 'super_admin') {
    throw new HttpsError('permission-denied', "Seul un super_admin peut attribuer ce rôle.");
  }

  // Anti-capture cross-org : si le compte cible appartient déjà à une organisation,
  // ce doit être celle de l'acteur. Un compte neuf (sans orgId) est intégrable.
  const target = await auth.getUser(uid).catch(() => null);
  if (!target) throw new HttpsError('not-found', 'Compte utilisateur introuvable.');
  const existingOrg = (target.customClaims as { orgId?: string } | undefined)?.orgId;
  if (existingOrg && existingOrg !== actor.orgId) {
    throw new HttpsError('permission-denied', "Ce compte appartient à une autre organisation.");
  }

  // Le rattachement à un département doit viser un département de l'organisation.
  if (departmentId) {
    const dep = await db.doc(`departments/${departmentId}`).get();
    if (!dep.exists || dep.get('orgId') !== actor.orgId) {
      throw new HttpsError('failed-precondition', 'Département invalide pour cette organisation.');
    }
  }

  await auth.setCustomUserClaims(uid, { role: role as Role, orgId: actor.orgId, departmentId, employeeId });
  // Reflet pour l'affichage (ne fait pas autorité).
  await db.doc(`users/${uid}`).set({ role, departmentId: departmentId ?? null }, { merge: true });

  await writeAudit({
    actor: { uid: req.auth!.uid, claims: actor },
    action: 'set_role', resource: 'users', resourceId: uid,
    after: { role, departmentId: departmentId ?? null },
  });
  return { ok: true };
});
