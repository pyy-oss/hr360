# 09 — Démarrer avec Claude Code

Ce dépôt est prêt pour Claude Code. Ouvre-le dans Claude Code et procède ainsi :

1. **Contexte** — Claude Code lit `CLAUDE.md` automatiquement. Laisse-le résumer le projet.
2. **Installer** — demande : « installe les dépendances front et functions, lance les
   émulateurs et vérifie que le module Absences tourne en local ».
3. **Compléter la Phase 0** (socle) — « implémente la page de connexion, la gestion des
   utilisateurs et l'attribution de rôle via `setUserRole`, puis écris les tests de règles
   Firestore avec `/firestore-rules-check` ».
4. **Dérouler la roadmap** — pour chaque module : lance `/new-module` et suis `docs/04`.
5. **Avant release** — `/prelaunch-check` puis `/security-review`.

Sous-agents disponibles : `firebase-architect`, `security-auditor`, `frontend-builder`.
Commandes : `/new-module`, `/security-review`, `/prelaunch-check`, `/firestore-rules-check`.

## Ce qui est déjà fourni (référence à imiter)
- **RBAC** complet : `setUserRole`, `firestore.rules`, gardes serveur et client.
- Module **Absences** : types zod partagés, `submitLeaveRequest` / `decideLeaveRequest`
  (RBAC + transaction + audit), trigger idempotent, hooks + page.
- Module **Formation** : types zod, `createTrainingPlan` / `updateEnrollment` /
  `closeTrainingNeed` (RBAC + audit), hooks + `FormationPage`.
- Module **Objectifs & évaluations** : types zod (pondérations = 100), `advanceCampaignPhase`
  (DRH, transitions verrouillées), `publishEvaluation`, `validateObjective` (RBAC + audit),
  hooks + `ObjectifsPage`.
- **Design system** : tokens Tailwind + bibliothèque `src/ui` (polices Space Grotesk /
  Inter / JetBrains Mono, accent teal), tous les écrans y sont alignés. Voir `docs/10`.
- Sécurité, index, CI/CD, gouvernance des secrets.

- **Consolidation** : tableau de bord d'accueil rôle-conscient (`DashboardPage`),
  édition de dossier (`EmployeeEditPage`, `/collaborateurs/:id/edit`).
- Module **Staffing & plan de charge** : types zod, `upsertMission` et
  `upsertAssignment` (RBAC + audit + garde anti sur-allocation >100% en transaction),
  hooks, `StaffingPage` (missions) et `WorkloadBar` (plan de charge par collaborateur).
- Module **Collaborateurs / annuaire** : types zod, fonctions `upsertEmployee`,
  `upsertDepartment`, `linkEmployeeAccount` (RBAC + audit + contrôle d'existence du
  département), hooks + `DirectoryPage` (annuaire, filtre, création) et `EmployeePage`.
- **Phase 0** : page de connexion (`LoginPage`), coquille applicative avec navigation et
  déconnexion (`AppShell`), et **administration des utilisateurs / attribution de rôle**
  (`UsersAdminPage` + `setUserRole`).

- **Tests fonctionnels des Cloud Functions** (`functions/test/`, 25 cas via
  `firebase-functions-test`) : logique métier réelle — solde de congés, garde anti
  sur-allocation, transitions de campagne, contrôle de département, audit, validation
  zod, RBAC serveur. Lancer avec `npm run test:functions`.
- **Tests de règles Firestore** : suite de 33 cas (allow/deny par rôle, cas limites) dans
  `tests/firestore.rules.test.ts`. Lancer avec `npm run test:rules`.

Le socle, les trois modules prioritaires et les tests de sécurité sont donc en place.
Il reste à :
1. installer les dépendances (`npm install` + `cd functions && npm install`) et lancer
   `npm run test:rules` puis `npm run test:functions` (émulateurs) ;
2. amorcer le premier `super_admin` (voir `scripts/bootstrap-admin.md`) ;
3. lancer les émulateurs et vérifier les parcours de bout en bout ;
4. étendre la suite selon la roadmap (`docs/04`) — ajouter les tests de règles à chaque module.
