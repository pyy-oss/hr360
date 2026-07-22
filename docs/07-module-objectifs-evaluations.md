# 07 — Module Objectifs & Évaluations (campagnes annuelles)

## Objectif
Gérer les campagnes annuelles : fixation d'objectifs, auto-évaluation, évaluation
manager, synthèse — avec un cadre commun et un suivi de l'avancement.

## Collections
- `objectiveCampaigns/{id}` : `{ orgId, year, name, phase
  /* preparation|fixation|suivi|evaluation|cloturee */, startDate, endDate, createdBy }`
- `objectives/{id}` : `{ orgId, campaignId, employeeId, departmentId, title, description,
  measure /* KPI/critère */, weight, progress /* 0..100 */, status
  /* brouillon|valide|atteint|partiel|non_atteint */ }`
- `evaluations/{id}` : `{ orgId, campaignId, employeeId, selfAssessment?,
  managerAssessment?, overallScore?, status /* en_cours|soumise|publiee */,
  publishedAt? }`

## Cycle d'une campagne (`phase`)
`preparation` → `fixation` (managers/collaborateurs posent les objectifs) →
`suivi` (mise à jour de l'avancement en continu) → `evaluation`
(auto-évaluation puis évaluation manager) → `cloturee`.

Les transitions de phase passent par une fonction (`advanceCampaignPhase`) réservée
`drh`, qui verrouille/déverrouille les écritures en conséquence et audite.

## Règles métier
- En phase `fixation` : le `collaborateur` peut proposer ses objectifs (statut
  `brouillon`) ; le `manager` du département valide (`valide`).
- En phase `evaluation` : le collaborateur remplit `selfAssessment` ; le manager remplit
  `managerAssessment`. L'un ne voit pas l'autre avant `publiee`.
- L'évaluation devient visible au collaborateur seulement quand `status == publiee`
  (via `publishEvaluation`, réservée manager/RH/DRH, auditée).
- La somme des `weight` des objectifs d'une personne doit valoir 100 (validation zod).

## Surface technique
- Types/zod : `src/types/objectifs.ts`
- Fonctions : `functions/src/objectifs/` (advanceCampaignPhase, publishEvaluation,
  validateObjective — toutes avec RBAC + audit).
- UI : `src/modules/objectifs/` (campagnes RH, mes objectifs, évaluation manager, synthèse).

## Liens
- Un objectif de développement peut créer un `trainingNeed`.
- La synthèse alimente le module Performance / la revue de rémunération.
