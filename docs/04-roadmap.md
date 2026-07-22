# 04 — Feuille de route de mise en œuvre

Principe : livrer un noyau utilisable vite, puis élargir. Chaque phase est déployable.

## Phase 0 — Socle (fondations)
- Projet Firebase, Hosting, émulateurs, CI/CD.
- Auth + **RBAC** (custom claims, `setUserRole`, règles, gardes front).
- Collections `organizations`, `users`, `employees`, `departments`.
- `auditLogs` + librairie d'audit.
- **Sortie** : on peut créer des utilisateurs, leur donner un rôle, sécuriser l'accès.

## Phase 1 — Collaborateurs & Absences  (première valeur métier)
- Annuaire + dossier collaborateur (lecture selon RBAC).
- **Absences & congés** : demande dématérialisée, workflow de validation, soldes,
  notifications. (`docs/05-module-absences.md`)
- **Sortie** : les équipes déposent et valident les congés dans l'outil. Gain immédiat.

## Phase 2 — Formation
- Catalogue, besoins par équipe, plans de formation, inscriptions, suivi.
  (`docs/06-module-formation.md`)
- **Sortie** : les managers cadrent les besoins et suivent les plans de leurs équipes.

## Phase 3 — Objectifs & Évaluations
- Campagnes annuelles, fixation d'objectifs, auto-évaluation, évaluation manager,
  synthèse. (`docs/07-module-objectifs-evaluations.md`)
- **Sortie** : cycle annuel de performance piloté dans l'outil.

## Phase 4+ — Extension suite (selon la maquette)
Recrutement/ATS, staffing & plan de charge, rémunération, engagement, offboarding,
puis la couche IA (scoring, prédiction, génération, RAG, gouvernance).

## Dépendances
RBAC (Phase 0) est prérequis de tout. Absences dépend de `employees` + `departments`.
Objectifs/évaluations réutilisent la notion de campagne (base commune à formaliser en Phase 3).
