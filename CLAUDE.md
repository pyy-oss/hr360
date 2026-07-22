# Neurones HR 360 — contexte projet (à lire en premier)

Tu construis **Neurones HR 360**, l'application RH interne de **Neurones Technologies SA**
(société de services IT & cybersécurité, Abidjan, zone UEMOA/CEMAC). Application web
autonome déployée sur **Firebase**. Ce fichier est ta source de vérité : respecte-le,
et consulte `docs/` pour le détail de chaque sujet.

## Ce que l'app fait (périmètre)
Suite RH couvrant le cycle « du CV à la confirmation » puis la vie du collaborateur.
Modules prioritaires pour la V1 (dans l'ordre) :
1. **Socle & RBAC** — authentification, rôles, permissions, audit. (voir `docs/03-rbac.md`)
2. **Collaborateurs & départements** — annuaire, dossier, organisation.
3. **Absences & congés** — dématérialisation des demandes + workflow de validation. (`docs/05-module-absences.md`)
4. **Formation** — besoins et plans de formation des équipes en poste. (`docs/06-module-formation.md`)
5. **Objectifs & évaluations** — campagnes annuelles de fixation d'objectifs et d'évaluation. (`docs/07-module-objectifs-evaluations.md`)
Modules ultérieurs (roadmap `docs/04-roadmap.md`) : recrutement/ATS, staffing, rémunération,
engagement, offboarding, couche IA.

## Stack (ne pas dévier sans raison)
- **Frontend** : React 18 + TypeScript + Vite. Routage `react-router-dom`.
  Données serveur : **TanStack Query** (jamais de `fetch` brut dispersé). UI : Tailwind CSS.
  Formulaires : `react-hook-form` + `zod` (validation partagée client/serveur).
- **Backend** : Firebase — Auth, **Firestore** (base), **Cloud Functions** (Node 20, TypeScript),
  **Hosting**, **Storage**. Fonctions callables (`onCall`) pour les mutations sensibles,
  triggers Firestore pour les effets de bord (audit, soldes, notifications).
- **Validation** : schémas `zod` dans `src/types` réutilisés côté Functions.
- **Tests** : Vitest (unité), Firebase Emulator Suite (règles + fonctions).

## Principes d'architecture (non négociables)
- **La sécurité vit côté serveur.** Les règles Firestore et les Cloud Functions sont
  l'autorité. Les gardes du frontend (routes, boutons) ne sont que du confort UX —
  ils ne protègent rien. Toute règle d'accès DOIT exister dans `firestore.rules`
  et/ou dans la fonction.
- **RBAC par custom claims.** Le rôle et le rattachement (`departmentId`, `employeeId`)
  vivent dans les *custom claims* du token Firebase, posés par une Cloud Function
  admin. Les règles Firestore lisent `request.auth.token`. Voir `docs/03-rbac.md`.
- **Aucune mutation sensible directe depuis le client.** Poser une décision de congé,
  changer un rôle, clôturer une campagne : toujours via une Cloud Function `onCall`
  qui revalide les droits et écrit un log d'audit.
- **Tout est audité.** Chaque action à impact écrit une entrée dans `auditLogs`
  (qui, quoi, quand, avant/après). Voir `functions/src/lib/audit.ts`.
- **Idempotence & transactions.** Les mises à jour de soldes de congés, de statuts de
  campagne, etc. passent par des transactions Firestore. Les fonctions déclenchées
  doivent être idempotentes (protégées contre le rejeu).
- **Pensé pour l'échelle.** Modélisation Firestore orientée requêtes (voir
  `docs/02-data-model.md`) : pas de collection à croissance non bornée sans
  pagination, index composites déclarés, `collectionGroup` pour les vues transverses.

## Sécurité — règles d'or (Neurones a déjà subi une suspension GCP pour fuite de secrets)
- **JAMAIS** commiter de secret : `.env`, clés de service, tokens. Ils sont dans
  `.gitignore`. Utiliser `.env.example` comme gabarit. Les secrets serveur passent par
  les *secrets* Firebase Functions / variables d'environnement de déploiement.
- **JAMAIS** de clé d'API privée ni de compte de service côté frontend.
- Toute donnée personnelle candidat/salarié : minimisation, conservation limitée,
  traçabilité (conformité **ARTCI**). Voir `docs/08-security-performance.md`.

## Conventions de code
- TypeScript strict. Pas de `any` non justifié. Types partagés dans `src/types`.
- Un module = un dossier sous `src/modules/<module>` (pages, hooks, composants) et,
  côté serveur, un dossier `functions/src/<module>`.
- Nommage : composants `PascalCase`, hooks `useXxx`, fonctions callables
  `verbeNom` (ex. `submitLeaveRequest`).
- Les accès Firestore passent par des *repositories* typés (`src/lib/db.ts`), jamais
  de requêtes brutes éparpillées dans les composants.
- Messages, libellés et UI **en français**.
- **Design** : utiliser la bibliothèque `src/ui` (PageHead, Card, Button, Field,
  Table, Badge, Bar, Notice…) et les tokens Tailwind (police display Space Grotesk,
  accent `signal`). Ne pas réintroduire de couleurs brutes. Voir `docs/10-design-system.md`.


## Ajouter un module
Suis `/new-module` (voir `.claude/commands/new-module.md`) : specs → types/zod →
règles Firestore → fonctions → UI → tests emulator. Ne saute jamais l'étape règles+tests.

## Commandes
- `npm run dev` — front en dev (Vite)
- `npm run emulators` — Firebase Emulator Suite (auth, firestore, functions)
- `npm run test` — Vitest
- `npm run build` — build front
- `npm run deploy` — build + déploiement Firebase (voir `.github/workflows/deploy.yml` en CI)

## Avant toute livraison
Lance `/prelaunch-check` et `/security-review`. Aucune release sans règles Firestore
testées et sans revue RBAC.
