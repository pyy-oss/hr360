# Tests fonctionnels des Cloud Functions

Ces tests exécutent la **logique métier** des fonctions (transactions, gardes RBAC
serveur, écriture d'audit, validation zod) contre les émulateurs, via
`firebase-functions-test`. Complément des tests de règles (`tests/`) : les règles
disent *qui* peut écrire, ces tests vérifient que les fonctions *calculent juste*.

## Lancer
```bash
npm run test:functions      # depuis la racine
```
La commande démarre les émulateurs Firestore + Auth, exécute la suite, puis les arrête.

## Couverture
- **absences** : `submitLeaveRequest` (réservation du solde en pending, refus si solde
  insuffisant, dates incohérentes) ; `decideLeaveRequest` (pending → taken à
  l'approbation, écriture d'audit, refus par un manager d'un autre département ou par le
  collaborateur, non-rejeu d'une demande déjà décidée).
- **staffing** : `upsertAssignment` — garde anti sur-allocation (>100% sur périodes
  chevauchantes refusé ; 100%+100% autorisé si pas de chevauchement) et portée manager.
- **objectifs** : `advanceCampaignPhase` (transition linéaire, saut refusé, non-DRH
  refusé) ; `publishEvaluation` (soumise → publiee, refus si pas soumise).
- **collaborateurs** : `upsertEmployee` (département inexistant refusé, droits
  insuffisants refusés, email invalide refusé, audit écrit).

## Étendre
À chaque nouvelle fonction sensible : au moins un cas nominal, un cas RBAC refusé, et un
cas de garde métier (transaction / validation).
