# /prelaunch-check — contrôle avant déploiement

Vérifie et rapporte :
- [ ] `npm run build` (front) et `cd functions && npm run build` passent sans erreur TS.
- [ ] `npm run test` (Vitest) vert, y compris les tests de règles Firestore (émulateur).
- [ ] Tous les index composites requis sont déclarés (`firestore.indexes.json`).
- [ ] Aucune requête Firestore non paginée dans le code.
- [ ] Aucune valeur sensible en dur ; `.env` absent du dépôt.
- [ ] `firebase deploy --only firestore:rules` en dry-run OK.
- [ ] `minInstances` posé sur les fonctions critiques.
- [ ] Variables d'env de prod configurées (secrets Functions).
Bloque la release si un point échoue.
