# Amorçage du premier administrateur

`setUserRole` est réservé à `super_admin`/`drh` — mais au tout début, personne ne l'est.
Pour poser le premier `super_admin`, exécute une fois un script Node avec le SDK Admin et
un compte de service (hors dépôt, jamais commité), puis supprime le compte de service :

```ts
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
// Le fichier de service NE DOIT PAS être commité (voir .gitignore).
initializeApp({ credential: cert(require('/chemin/hors-depot/serviceAccount.json')) });
await getAuth().setCustomUserClaims('<UID_DU_PREMIER_ADMIN>', {
  role: 'super_admin', orgId: 'neurones',
});
console.log('super_admin posé. Rafraîchir le token côté client.');
```

Ensuite, toute attribution de rôle passe par la fonction `setUserRole` dans l'app.

## Script prêt à l'emploi

Un script exécutable est fourni : `functions/scripts/bootstrap-admin.mjs`
(placé sous `functions/` pour réutiliser `firebase-admin` déjà installé).

```bash
cd functions
GOOGLE_APPLICATION_CREDENTIALS=/chemin/HORS-DEPOT/serviceAccount.json \
  node scripts/bootstrap-admin.mjs <UID> [orgId]   # orgId par défaut : neurones
```

L'UID se passe en argument (jamais commité). La clé de compte de service reste
hors dépôt.
