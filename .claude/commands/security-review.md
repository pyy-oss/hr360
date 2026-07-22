# /security-review — revue de sécurité & RBAC

Passe en revue, et corrige si besoin :
1. **Règles Firestore** — chaque collection a une règle explicite ; le catch-all final
   refuse tout ; aucune écriture de champ sensible (`status`, `role`) autorisée au client.
2. **RBAC** — chaque `onCall` sensible appelle `assertRole`/`assertDeptManagerOrHR` AVANT
   toute écriture. La matrice `docs/03-rbac.md` est respectée côté règles ET fonctions.
3. **Audit** — chaque mutation sensible écrit dans `auditLogs`.
4. **Transactions** — soldes, phases de campagne et autres états partagés sont transactionnels.
5. **Secrets** — aucun `.env`, clé de service ou token dans le dépôt ni le code client.
6. **Validation** — toute entrée `onCall` est validée par `zod` côté serveur.
7. **Storage** — chemins protégés par rôle ; taille de fichier limitée.
8. **App Check** — activé pour l'API (recommandé).
Rends un rapport : conforme / à corriger, avec le correctif proposé.
