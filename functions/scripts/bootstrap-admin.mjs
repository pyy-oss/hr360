// Amorçage du premier super_admin (à lancer UNE FOIS, en local).
//
// setUserRole est réservé aux admins ; au tout début personne ne l'est, donc on pose
// le tout premier super_admin directement avec le SDK Admin + un compte de service.
//
// Usage (depuis le dossier functions/) :
//   cd functions
//   GOOGLE_APPLICATION_CREDENTIALS=/chemin/HORS-DEPOT/serviceAccount.json \
//     node scripts/bootstrap-admin.mjs <UID> [orgId] [role]
//   (role par défaut : super_admin)
//
// La clé de compte de service NE DOIT JAMAIS être commitée (voir .gitignore).
// Ensuite, toutes les attributions de rôles passent par la fonction setUserRole.

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const ROLES = ['super_admin', 'drh', 'rh', 'manager', 'collaborateur', 'lecture'];

const uid = process.argv[2] || process.env.ADMIN_UID;
const orgId = process.argv[3] || process.env.ORG_ID || 'neurones';
const role = process.argv[4] || process.env.ADMIN_ROLE || 'super_admin';

if (!uid) {
  console.error('Usage : node scripts/bootstrap-admin.mjs <UID> [orgId] [role]');
  process.exit(1);
}
if (!ROLES.includes(role)) {
  console.error(`Rôle invalide "${role}". Valeurs : ${ROLES.join(', ')}`);
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });

await getAuth().setCustomUserClaims(uid, { role, orgId });

const user = await getAuth().getUser(uid);
console.log(`✓ Rôle "${role}" posé sur ${user.email ?? uid} (orgId="${orgId}").`);
console.log('  Reconnecte-toi dans l’app (le token se rafraîchit) pour activer le rôle.');
