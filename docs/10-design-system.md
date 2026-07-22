# 10 — Design system

L'identité visuelle de Neurones HR 360 est portée par des tokens Tailwind et une
bibliothèque de composants (`src/ui/index.tsx`), alignés sur la maquette de référence.

## Tokens (tailwind.config.js)
- Couleurs : `ink` / `ink-2` (fonds sombres), `signal` / `signal-deep` / `signal-soft`
  (accent teal), `canvas` (fond de page), `surface`, `line` (bordures), `muted` /
  `muted-2` (textes secondaires), sémantiques `high` (ok), `mid` (vigilance),
  `low` (risque), `gold`.
- Polices : `font-display` (Space Grotesk — titres), `font-sans` (Inter — corps),
  `font-mono` (JetBrains Mono — dates, codes, tags).
- `rounded-2xl`, `shadow-card` pour les surfaces.

## Composants (`@/ui`)
`PageHead`, `Card` / `CardHead` / `CardBody`, `Button` (primary | ghost | subtle),
`Field`, `Input`, `Select`, `Badge` (neutral | teal | ok | warn | danger | gold),
`Bar`, `Table` / `Row` / `Cell`, `Notice`, `Tag`.

## Règles d'usage
- Toute page commence par un `PageHead` (titre + sous-titre + actions).
- Les données tabulaires passent par `Table`/`Row`/`Cell` ; les statuts par `Badge`.
- Les formulaires utilisent `Field` + `Input`/`Select` ; les actions par `Button`.
- Les libellés restent en français ; les dates/codes en `font-mono`.
- Ne pas réintroduire de classes de couleur brutes (`bg-slate-…`) hors du kit : passer
  par les tokens pour rester cohérent avec la maquette.

## Étendre
Ajouter un composant réutilisable dans `src/ui/index.tsx` plutôt que de le dupliquer
dans un écran. Nouveaux besoins visuels récurrents (KPI, timeline, onglets) → composant
dédié ici.
