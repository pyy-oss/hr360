# 01 — Architecture

## Vue d'ensemble
Application web SPA (React/Vite) servie par **Firebase Hosting**, adossée à **Firestore**
pour les données, **Cloud Functions** pour la logique métier sensible et les triggers,
**Firebase Auth** pour l'identité, **Storage** pour les pièces jointes (justificatifs,
documents RH).

```
[Navigateur] --HTTPS--> [Firebase Hosting: SPA React]
     |                          |
     | Firebase SDK             | onCall (mutations sensibles)
     v                          v
[Firestore] <--triggers--> [Cloud Functions (Node20/TS)]
     ^                          |
     | security rules (RBAC)    | Admin SDK (custom claims, audit)
     |                          v
[Storage]                  [auditLogs, notifications]
```

## Trois couches de sécurité (défense en profondeur)
1. **Frontend** — gardes de route/composant (`RequirePermission`). Confort UX uniquement.
2. **Firestore rules** — autorité sur les lectures et les écritures directes autorisées.
3. **Cloud Functions** — autorité sur les mutations sensibles (décisions, changements de
   rôle, clôtures de campagne) : revalidation des droits + transaction + audit.

Règle : *si une action doit être restreinte, elle est restreinte au niveau 2 et/ou 3.
Le niveau 1 ne compte pas.*

## Flux type — décision de congé
1. Le manager clique « Valider » → appel `onCall decideLeaveRequest({id, decision})`.
2. La fonction : vérifie le rôle (`manager` du bon département, ou `drh`/`rh`),
   ouvre une transaction, met à jour le statut, ajuste le solde, écrit `auditLogs`.
3. Un trigger `onUpdate` sur `leaveRequests` émet une notification au collaborateur.
Le client ne modifie **jamais** `status` directement (interdit par les règles).

## Performance & robustesse
- **TanStack Query** : cache, invalidation ciblée, pagination — pas de re-fetch inutile.
- **Index composites** déclarés dans `firestore.indexes.json` pour chaque requête filtrée/triée.
- **min instances** sur les fonctions critiques pour éviter le cold start.
- **Pagination** obligatoire sur toute liste (aucune requête non bornée).
- **Gestion d'erreur** homogène : les `onCall` renvoient des `HttpsError` typées ;
  le front les mappe en messages FR clairs.
- **Journalisation structurée** côté fonctions (JSON) pour l'observabilité.

## Évolutivité
- Modèle multi-tenant *ready* : un champ `orgId` présent partout, même si une seule
  organisation en V1 — évite une migration douloureuse plus tard.
- Modules découplés : chaque module a ses collections, ses fonctions, ses règles.
  Ajouter un module ne touche pas les autres.
