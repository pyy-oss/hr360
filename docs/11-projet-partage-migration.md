# 11 — Projet Firebase partagé & migration future

hr360 est déployé, **à titre transitoire**, dans un projet Firebase **partagé** avec
d'autres applications (le temps de résoudre un incident de compte sur le projet dédié).
Ce document décrit l'isolation mise en place et le chemin de migration vers un projet
dédié — pensé pour être **sans douleur**.

## Principe : isolation par ressources dédiées

Dans le projet partagé, hr360 n'utilise **jamais** les ressources « par défaut »
(qui appartiennent à l'autre application). Tout est cloisonné et fixé sur **europe-west1** :

| Ressource | hr360 | À NE PAS toucher (autre app) |
|---|---|---|
| Firestore | base **nommée** `hr360` | base `(default)` |
| Hosting | site `hr360` | site par défaut |
| Storage | bucket dédié (`VITE_FIREBASE_STORAGE_BUCKET`) | bucket par défaut |
| Functions | codebase `hr360` (région europe-west1) | autres codebases |

Conséquences dans le code :
- `src/lib/firebase.ts` lit tout depuis l'environnement : `getFirestore(app, VITE_FIREBASE_DB_ID)`,
  `getFunctions(app, VITE_FIREBASE_REGION)`, bucket via `VITE_FIREBASE_STORAGE_BUCKET`.
- `firebase.json` déclare la base nommée, le site, le bucket et le codebase `hr360`.
- Le déploiement CI (`.github/workflows/deploy.yml`) est **restreint** à
  `hosting,firestore,functions:hr360,storage` → il ne peut pas écraser l'autre app.

## Mise en place (une seule fois, sur le projet partagé)

Prérequis : être **Éditeur/Propriétaire** du projet partagé.

```bash
# 0. Cibler le projet et se connecter
cp .firebaserc.example .firebaserc      # renseigner le projectId
cp .env.example .env                    # renseigner la config web (console Firebase)

# 1. Base Firestore nommée « hr360 » en europe-west1
gcloud firestore databases create --database=hr360 --location=europe-west1

# 2. Site Hosting « hr360 »
firebase hosting:sites:create hr360

# 3. Bucket Storage dédié en europe-west1 (nom global unique)
#    Renseigner ensuite ce nom dans firebase.json ("storage".bucket) ET dans
#    VITE_FIREBASE_STORAGE_BUCKET.
gsutil mb -l europe-west1 gs://<VOTRE_BUCKET_HR360>

# 4. Déployer UNIQUEMENT les ressources hr360
firebase deploy --only "hosting,firestore,functions:hr360,storage" --project <projectId>
```

> ⚠️ **Projet partagé** : ne jamais lancer `firebase deploy` sans `--only`. Les règles
> Storage/Firestore et les fonctions de l'autre application seraient écrasées.

## CI (GitHub Actions)

`deploy.yml` déploie sur push vers `main`, restreint aux ressources hr360.
Authentification par **compte de service** (méthode pérenne ; le `--token` de
`firebase login:ci` est déprécié). À configurer sur le dépôt :
- **Secret** `FIREBASE_SERVICE_ACCOUNT` = le **contenu JSON** d'une clé de compte de
  service du projet, au **moindre privilège** (rôles de déploiement Firebase : Hosting,
  Firestore, Cloud Functions, Storage, + « Service Account User »). C'est un secret privé :
  jamais commité, jamais côté frontend.
- **Variable** (ou Secret) `FIREBASE_PROJECT_ID` = l'id du projet partagé.
- **Variable** (ou Secret) `VITE_FIREBASE_API_KEY` = la clé web (publique) du projet.
  Nécessaire à la **compilation** du front : Vite fige les `VITE_*` dans le bundle, donc
  la config doit exister au moment du `npm run build` en CI (le `.env` local n'y est pas).
  Les autres identifiants web (publics) sont fournis directement par le workflow.

Le workflow écrit le JSON du compte de service dans un fichier temporaire, pointe
`GOOGLE_APPLICATION_CREDENTIALS` dessus le temps du déploiement, puis le supprime.

## Migration vers un projet DÉDIÉ (plus tard)

L'isolation ci-dessus rend la migration mécanique :

1. **Créer** le nouveau projet Firebase, région **europe-west1**, activer Auth/Firestore/
   Functions/Hosting/Storage.
2. **Exporter** la base nommée depuis le projet partagé et **l'importer** comme base
   `(default)` du nouveau projet :
   ```bash
   gcloud firestore export gs://<bucket-export> --database=hr360 --project <projet-partagé>
   gcloud firestore import gs://<bucket-export> --database='(default)' --project <projet-dédié>
   ```
3. **Storage** : recopier le contenu du bucket dédié vers le bucket du nouveau projet
   (`gsutil -m rsync -r`).
4. **Auth** : `firebase auth:export` / `auth:import` (les custom claims RBAC sont
   re-posés par `setUserRole` si besoin).
5. **Reconfigurer l'app** — uniquement l'environnement, aucun code à changer :
   - `VITE_FIREBASE_*` → nouveau projet/bucket ;
   - `VITE_FIREBASE_DB_ID` → `(default)` ;
   - `.firebaserc` → nouveau projectId ;
   - `firebase.json` → `firestore[0].database = "(default)"`, `hosting.site`/`storage.bucket`
     du nouveau projet ; `functions[0].codebase` peut redevenir `default`.
6. **Déployer** sur le projet dédié, vérifier, puis basculer le DNS/hosting.

Comme tout passe par l'environnement, l'application n'a **aucune dépendance en dur** au
projet partagé : la migration se résume à recréer les ressources et à pointer le `.env`.
