# /firestore-rules-check — tester les règles Firestore

Avec l'émulateur Firestore, génère/complète des tests couvrant, POUR CHAQUE collection
et CHAQUE rôle (`super_admin`, `drh`, `rh`, `manager`, `collaborateur`, `lecture`) :
- un accès **autorisé** attendu (assert allow),
- un accès **refusé** attendu (assert deny),
- les cas limites : collaborateur tentant d'écrire `status`/`role`, manager d'un AUTRE
  département, lecture d'une évaluation non publiée par le collaborateur.
Utilise `@firebase/rules-unit-testing`. Rends la couverture par collection.
