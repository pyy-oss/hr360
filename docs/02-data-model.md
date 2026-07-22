# 02 — Modèle de données Firestore

Principe : modélisation orientée requêtes, `orgId` partout (multi-tenant ready),
dénormalisation maîtrisée pour la lecture, transactions pour la cohérence.

## Collections

### `organizations/{orgId}`
`{ name, country, createdAt }`

### `departments/{departmentId}`
`{ orgId, name, managerUid, createdAt }`

### `users/{uid}`  (miroir du compte Auth)
`{ orgId, employeeId, email, displayName, role, departmentId, active, createdAt }`
> Le `role` faisant autorité est dans les **custom claims**, pas ici (ce champ est un
> reflet pour l'affichage). Voir `docs/03-rbac.md`.

### `employees/{employeeId}`  (dossier RH)
`{ orgId, uid, firstName, lastName, departmentId, jobTitle, seniorityLevel,
   contractType, hireDate, status /* essai|confirme|sortant */, managerUid }`

### `leaveRequests/{id}`  (absences & congés)
`{ orgId, employeeId, departmentId, type /* conges_payes|rtt|maladie|sans_solde|... */,
   startDate, endDate, days, reason, status /* soumis|valide_manager|approuve|refuse|annule */,
   currentApproverUid, decisions[], createdAt, updatedAt }`

### `leaveBalances/{employeeId}`
`{ orgId, employeeId, year, entitlements: { conges_payes, rtt, ... },
   taken: {...}, pending: {...} }`
> Mis à jour uniquement par transaction dans les fonctions (jamais côté client).

### `trainingCatalog/{id}` / `trainingNeeds/{id}` / `trainingPlans/{id}` / `enrollments/{id}`
Voir `docs/06-module-formation.md`.

### `objectiveCampaigns/{id}` / `objectives/{id}` / `evaluations/{id}`
Voir `docs/07-module-objectifs-evaluations.md`.

### `auditLogs/{id}`  (append-only)
`{ orgId, actorUid, actorRole, action, resource, resourceId, before, after, at }`
> Lecture réservée `drh`/`super_admin`. Écriture **serveur uniquement**.

### `notifications/{id}`
`{ orgId, toUid, type, payload, read, createdAt }`

## Index composites (déclarer dans `firestore.indexes.json`)
- `leaveRequests` : (`departmentId`, `status`, `startDate`) — file du manager.
- `leaveRequests` : (`employeeId`, `startDate desc`) — historique du collaborateur.
- `objectives` : (`campaignId`, `employeeId`) — objectifs par campagne/personne.
- `enrollments` : (`employeeId`, `status`) — parcours du collaborateur.
- collectionGroup `evaluations` : (`orgId`, `campaignId`, `status`) — vues transverses RH.

## Règles de modélisation
- Toute liste paginée (`limit` + curseur). Pas de `get all`.
- Dénormaliser `departmentId` sur les documents interrogés par département (évite les jointures).
- Ne jamais stocker un secret ou une donnée sensible non nécessaire (minimisation ARTCI).
