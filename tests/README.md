# Tests des règles Firestore

Ces tests vérifient le RBAC au niveau des données (l'autorité réelle). Ils s'exécutent
contre l'émulateur Firestore avec `@firebase/rules-unit-testing`.

## Lancer
```bash
npm run test:rules
```
La commande démarre l'émulateur Firestore, exécute la suite, puis l'arrête
(`firebase emulators:exec --only firestore`).

## Couverture (46 cas, 3 fichiers)
Pour chaque collection sensible, au moins un cas **autorisé** et un cas **refusé**, plus
les gardes critiques :
- `users` : le rôle ne se change pas par écriture directe (uniquement via `setUserRole`).
- `employees` : portée département (manager) et self (collaborateur).
- `leaveRequests` : création de SA demande en `soumis` ; interdiction de créer pour autrui
  ou de s’auto-approuver ; annulation autorisée ; lecture limitée au bon département.
- `leaveBalances` : lecture selon portée, **aucune** écriture client (même DRH).
- `objectives` : brouillon par le collaborateur ; pas d’auto-validation.
- `evaluations` : lecture par le collaborateur seulement si `publiee` ; pas d’auto-publication.
- `trainingNeeds` : création limitée au manager de son département.
- `auditLogs` : lecture DRH uniquement, écriture serveur uniquement.
- `notifications` : chacun accède aux siennes.
- catch-all : collection inconnue et non authentifié refusés.
- `departments` : lecture par tout membre de l’organisation, écriture réservée DRH.
- `employees` (annuaire) : RH voit toute l’organisation, un manager seulement son département.
- `missions` / `assignments` (staffing) : portée département/self, création limitée au bon département.

## Étendre
À chaque nouveau module, ajouter ici les cas allow/deny par rôle (voir
`.claude/commands/firestore-rules-check.md`).
