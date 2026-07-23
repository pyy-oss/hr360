// Amorçage du premier super_admin (à lancer UNE FOIS, en local).
//
// setUserRole est réservé aux admins ; au tout début personne ne l'est, donc on pose
// le tout premier super_admin directement avec le SDK Admin + un compte de service.
//
// Usage (depuis le dossier functions/) :
//   cd functions
//   GOOGLE_APPLICATION_CREDENTIALS=/chemin/HORS-DEPOT/serviceAccount.json \
//     node scripts/bootstrap-admin.mjs <UID> [orgId]
//
// La clé de compte de service NE DOIT JAMAIS être commitée (voir .gitignore).
// Ensuite, toutes les attributions de rôles passent par la fonction setUserRole.

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const uid = process.argv[2] || process.env.ADMIN_UID;
const orgId = process.argv[3] || process.env.ORG_ID || 'neurones';

if (!uid) {
  console.error('Usage : node scripts/bootstrap-admin.mjs <UID> [orgId]');
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });

const claims = { role: 'super_admin', orgId };
await getAuth().setCustomUserClaims(uid, claims);

const user = await getAuth().getUser(uid);
console.log(`✓ super_admin posé sur ${user.email ?? uid} (orgId="${orgId}").`);
console.log('  Reconnecte-toi dans l’app (le token se rafraîchit) pour activer le rôle.');
