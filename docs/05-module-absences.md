# 05 — Module Absences & congés (dématérialisation)

## Objectif
Remplacer les demandes papier/mail par un flux dématérialisé : le collaborateur dépose,
le circuit de validation s'exécute, les soldes se mettent à jour, tout est tracé.

## Types d'absence
`conges_payes`, `rtt`, `maladie` (avec justificatif), `sans_solde`, `evenement_familial`,
`recuperation`. La liste et les droits sont paramétrables (collection `settings`).

## Cycle de vie d'une demande (`leaveRequests.status`)
`soumis` → `valide_manager` → `approuve` | `refuse` | (`annule` par le demandeur avant décision)

Circuit par défaut : **manager du département** puis, au-delà d'un seuil (ex. > 10 jours
consécutifs), validation **DRH**. Le seuil est paramétrable.

## Règles métier
- Le collaborateur crée une demande **pour lui-même** (`employeeId == token.employeeId`),
  statut initial forcé à `soumis`. Il peut l'annuler tant qu'aucune décision n'est prise.
- Le collaborateur ne peut **jamais** écrire `status` autre que `soumis`/`annule`.
- Seuls `manager` (de son département), `rh`, `drh` décident — via la fonction
  `decideLeaveRequest`, jamais par écriture directe.
- La décision met à jour le solde (`leaveBalances`) en **transaction** :
  `pending -= days` et, si approuvé, `taken += days`.
- Contrôles : dates cohérentes, chevauchement avec une demande existante, solde suffisant
  (validation `zod` partagée + revalidation serveur).
- Justificatif (arrêt maladie) : upload dans Storage sous `leave/{orgId}/{id}/…`, accès
  restreint (RBAC Storage).

## Surface technique
- Types/zod : `src/types/absences.ts`
- Fonctions : `functions/src/absences/submitLeaveRequest.ts`,
  `functions/src/absences/decideLeaveRequest.ts`,
  trigger `functions/src/absences/onLeaveDecision.ts` (notification).
- Règles Firestore : bloc `leaveRequests` / `leaveBalances` (voir `firestore.rules`).
- UI : `src/modules/absences/` (formulaire de demande, file du manager, historique, soldes).

## Écrans
- **Collaborateur** : nouvelle demande, mes demandes, mes soldes.
- **Manager** : file d'attente du département (valider/refuser, motif).
- **RH/DRH** : vue globale, exports, paramétrage des types et seuils.
