# D.RED — Prototype haute-fidélité

D.RED (Digital Blood Response & Exchange Directory) coordonne hôpitaux, CNTS
et donneurs pour réduire le délai d'accès au sang. Ce dépôt est un
**prototype de démonstration** (hackathons, concours, pitchs partenaires) —
pas un produit de production. Voir `CLAUDE.md` pour le contexte produit
complet et les conventions.

## Architecture

```
apps/
  donor-app/       Next.js — un seul acteur (Donneur)               port 3000
  infrastructure/  Next.js — acteurs Établissement + CNTS            port 3001
  sync-server/     Express + Socket.IO, état en mémoire              port 4000
packages/
  ui/            design tokens D.RED + composants shadcn/ui partagés
  types/         modèles de domaine partagés
  mock-data/     jeux de données seed
  utils/         helpers partagés (id, distance/ETA simulés, formatage)
  sync-client/   client Socket.IO + store Zustand partagé ("dredStore")
  tsconfig/      tsconfig partagés
  eslint-config/ config ESLint partagée
```

Aucun vrai backend applicatif, aucune vraie base de données, aucune vraie
authentification — tout est simulé. La seule exception volontaire :
`apps/sync-server` est un vrai processus réseau (Express + Socket.IO), mais
son état est 100% en mémoire et éphémère (remis à zéro à chaque redémarrage,
ou via Mode Démo).

## Prérequis

- Node.js ≥ 20
- pnpm (`corepack enable` ou `npm i -g pnpm`)

## Installation

```bash
pnpm install
```

## Lancer la démo

Trois processus doivent tourner simultanément (trois terminaux, ou
`pnpm dev` à la racine qui les lance tous via Turborepo) :

```bash
pnpm dev
```

Ou individuellement :

```bash
pnpm --filter @d-red/sync-server dev   # http://localhost:4000
pnpm --filter @d-red/donor-app dev     # http://localhost:3000
pnpm --filter @d-red/infrastructure dev # http://localhost:3001
```

Ouvrez ensuite 2–3 fenêtres/onglets pour jouer les rôles Donneur, Hôpital et
CNTS en simultané — c'est le mode de démonstration prévu (voir `CLAUDE.md`,
section Core Loop).

## Vérifications

```bash
pnpm turbo run build lint type-check
```

### Tests d'intégration du Decision Engine

Avec le sync-server déjà démarré (`pnpm --filter @d-red/sync-server dev`) :

```bash
pnpm --filter @d-red/sync-server test:scenarios
```

Rejoue automatiquement les scénarios A-G, les Decision Policies (WC-03) et
le Mode Démo contre le serveur réel. ⚠️ Remet l'état à zéro plusieurs fois
pendant l'exécution — à ne pas lancer pendant une démo en cours.

## Écrans

Voir `PROGRESS.md` pour l'inventaire complet des écrans (codes MD-*/WH-*/WC-*)
et leur état d'avancement, et `TODO.md` pour les fonctionnalités V2 non
couvertes par ce prototype.
