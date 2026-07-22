# 08 — Sécurité, performance, conformité

## Sécurité
- **Autorité serveur** : règles Firestore + Cloud Functions. Le front ne sécurise rien.
- **RBAC** par custom claims (voir `docs/03-rbac.md`). Rafraîchir le token après changement.
- **Mutations sensibles** exclusivement via `onCall` qui revalident les droits + auditent.
- **Storage** : règles par chemin (`leave/{orgId}/{id}` accessible au demandeur + valideurs).
- **Secrets** : jamais dans le dépôt. `.env` (front, valeurs publiques Firebase seulement)
  et *secrets Functions* (côté serveur). Historique Neurones : une suspension GCP est déjà
  survenue pour fuite de credentials — traiter cette règle comme critique.
- **App Check** recommandé (protège l'API contre les abus hors application).

## Performance
- Pagination partout (`limit` + curseurs), aucune requête non bornée.
- Index composites déclarés (`firestore.indexes.json`) — tester chaque requête filtrée/triée.
- TanStack Query : cache + invalidation ciblée ; éviter les lectures redondantes.
- `minInstances` sur les fonctions critiques (décision de congé, auth) contre le cold start.
- Dénormalisation ciblée pour les vues de liste (department, statut).

## Robustesse
- Transactions Firestore pour tout état partagé (soldes, phases de campagne).
- Fonctions déclenchées **idempotentes** (garde anti-rejeu).
- `HttpsError` typées → messages FR côté client ; jamais d'erreur brute exposée.
- Journalisation structurée (JSON) + `auditLogs` append-only.
- Tests des règles via l'émulateur (cas passant ET cas refusé pour chaque rôle).

## Conformité (ARTCI)
- Minimisation des données personnelles ; conservation limitée et paramétrable.
- Traçabilité des accès et décisions (`auditLogs`).
- Droit d'accès / rectification / suppression du salarié (à outiller côté DRH).
- Données hébergées et traitées de façon maîtrisée ; documenter le registre de traitement.
