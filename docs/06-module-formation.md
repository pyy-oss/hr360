# 06 — Module Formation (besoins & plans des équipes)

## Objectif
Suivre les besoins de formation des équipes en poste et piloter les plans de formation,
en lien avec les compétences et les objectifs.

## Collections
- `trainingCatalog/{id}` : `{ orgId, title, category, provider /* interne|externe */,
  durationHours, skillsTargeted[] }`
- `trainingNeeds/{id}` : `{ orgId, employeeId?, departmentId?, skill, priority, source
  /* entretien|matrice|manager|auto */, status /* ouvert|planifie|clos */, createdBy }`
- `trainingPlans/{id}` : `{ orgId, year, scope /* org|dept|employee */, departmentId?,
  items: [{ catalogId, targetEmployees[], status, budgetIndex? }], status }`
- `enrollments/{id}` : `{ orgId, employeeId, catalogId, planId?, status
  /* inscrit|en_cours|termine|certifie|abandonne */, startedAt?, completedAt? }`

## Règles métier
- Un `manager` gère les besoins et plans **de son département** ; `rh`/`drh` gèrent tout.
- Un besoin peut être créé automatiquement à partir d'une lacune (matrice de compétences)
  ou d'un entretien annuel — champ `source`.
- La progression d'une inscription (`enrollments.status`) est mise à jour par
  manager/RH ; le collaborateur la consulte.
- Pas de montants réels de budget en clair : `budgetIndex` relatif (cohérent avec le
  module Rémunération). La politique budget reste côté DRH.

## Surface technique
- Types/zod : `src/types/formation.ts`
- Fonctions : `functions/src/formation/` (création de plan, clôture d'un besoin,
  mise à jour d'inscription — avec audit).
- UI : `src/modules/formation/` (catalogue, besoins par équipe, plans, suivi).

## Liens
- Alimenté par la **matrice de compétences** (cases faibles → besoins).
- Alimente les **objectifs** (un objectif « se certifier » relie une inscription).
