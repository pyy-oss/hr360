# Neurones HR 360

Application RH interne de Neurones Technologies SA — suite complète de gestion du cycle
de vie du collaborateur, déployée sur Firebase. Ce dépôt est un **kit de démarrage
Claude Code** : architecture, modèle de données, règles de sécurité RBAC, scaffolding
frontend/backend et fichiers d'orchestration Claude Code.

## Démarrage rapide

```bash
# 1. Dépendances
npm install
cd functions && npm install && cd ..

# 2. Configuration
cp .env.example .env            # renseigner la config Firebase (web) — jamais commité
cp .firebaserc.example .firebaserc

# 3. Développement local (émulateurs)
npm run emulators               # Auth + Firestore + Functions + Hosting en local
npm run dev                     # frontend Vite

# 4. Déploiement
npm run deploy
```

## Structure

| Chemin | Rôle |
|---|---|
| `CLAUDE.md` | Contexte projet — à lire en premier par Claude Code |
| `docs/` | Vision, architecture, modèle de données, RBAC, roadmap, specs modules |
| `.claude/` | Commandes et sous-agents Claude Code |
| `firestore.rules` | Règles de sécurité (autorité RBAC côté données) |
| `functions/` | Cloud Functions (TypeScript) |
| `src/` | Frontend React + Vite + TypeScript |

## Pile technique
React 18 · TypeScript · Vite · Tailwind · TanStack Query · Firebase (Auth, Firestore,
Functions, Hosting, Storage) · zod · Vitest · Firebase Emulator Suite.

## Sécurité
La sécurité est appliquée **côté serveur** (règles Firestore + Cloud Functions). Voir
`docs/03-rbac.md` et `docs/08-security-performance.md`. Ne jamais commiter de secret.
