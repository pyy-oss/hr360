# /new-module — ajouter un module RH de bout en bout

Objectif : implémenter un nouveau module en respectant l'architecture (sécurité serveur,
RBAC, audit, tests). Ne jamais sauter les étapes 3 et 6.

## Étapes (dans l'ordre)
1. **Spec** — lire/écrire `docs/0X-module-<nom>.md` : collections, cycle de vie, règles métier.
2. **Types & validation** — `src/types/<nom>.ts` : schémas `zod` partagés client/serveur.
3. **Règles Firestore** — ajouter le bloc dans `firestore.rules` (lecture par rôle,
   écritures directes autorisées, tout le reste refusé). Écrire les cas de test.
4. **Cloud Functions** — `functions/src/<nom>/` : mutations sensibles en `onCall`
   (RBAC via `lib/rbac.ts` + audit via `lib/audit.ts` + transactions). Triggers idempotents.
   Exporter dans `functions/src/index.ts`.
5. **Frontend** — `src/modules/<nom>/` : hooks TanStack Query (lecture Firestore paginée,
   mutations via callables), pages, gardes `RequirePermission` (UX). Route dans `App.tsx`.
6. **Tests émulateur** — pour chaque règle : un cas passant ET un cas refusé par rôle ;
   pour chaque fonction : droits, validation, transaction, audit.

## Rappels
- La sécurité vit côté serveur. Le front ne protège rien.
- Pagination obligatoire. Index composites déclarés dans `firestore.indexes.json`.
- Libellés en français. Pas de secret dans le dépôt.
