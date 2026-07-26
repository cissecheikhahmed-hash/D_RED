# D.RED

D.RED (Digital Blood Response & Exchange Directory) coordonne hôpitaux, CNTS
et donneurs pour réduire le délai d'accès au sang.

**Depuis le 2026-07-26, le projet est en transition vers une application de
production réelle** — mobile (iOS/Android, React Native/Expo) connectée à un
backend **Supabase** (Postgres + auth + RLS + realtime) — après avoir démarré
comme prototype de démonstration haute-fidélité (hackathons, concours,
pitchs partenaires). Le monorepo web ci-dessous reste fonctionnel et sert de
référence UX/produit pendant la transition. Voir `CLAUDE.md` pour le contexte
produit complet et les conventions.

## 🚀 Lancer la démo

```bash
pnpm install && pnpm dev
```

Puis cliquez (la démo tourne entièrement en local, aucune requête réseau
externe — condition d'une démo live fiable) :

| Application | Lien | Rôle |
|---|---|---|
| 📱 **Donneur** | [localhost:3000](http://localhost:3000) | Parcours mobile complet MD-01 → MD-14 (veille, mission, guidage GPS, QR, gratification) |
| 🏥 **Hôpital / Établissement** | [localhost:3001/hospital/wh-01](http://localhost:3001/hospital/wh-01) | Urgence éclair WH-03, timeline temps réel WH-04, scan réception WH-05 |
| 🩸 **CNTS (régulation)** | [localhost:3001/cnts/wc-01](http://localhost:3001/cnts/wc-01) | Supervision, validation téléphonique, Decision Policies, console labo |
| 🗺️ **Vue nationale (Admin)** | [localhost:3001/admin/wa-01](http://localhost:3001/admin/wa-01) | Lecture seule, vue d'ensemble |
| 🎛️ **Console démo** | [localhost:3001/demo](http://localhost:3001/demo) | Pause / pas-à-pas / redémarrage, **Mode Autonome** (la démo se joue toute seule) |

Ouvrez Donneur + Hôpital + CNTS côte à côte (2-3 fenêtres) : chaque action
d'un acteur se propage en temps réel chez les autres. Pour une vitrine sans
présentateur, activez le **Mode Autonome** sur la console démo et laissez la
fenêtre Donneur dérouler le parcours en boucle.

## Architecture

```
apps/
  donor-app/       Next.js — un seul acteur (Donneur, web)           port 3000
  donor-mobile/    Expo (React Native) — Donneur mobile, connecté à Supabase
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

**Historique (avant le pivot du 2026-07-26)** : aucun vrai backend
applicatif, aucune vraie base de données, aucune vraie authentification —
tout était simulé, seule exception volontaire `apps/sync-server` (process
réseau réel, état 100% en mémoire et éphémère). Cette contrainte ne
s'applique plus au périmètre production/mobile — voir `CLAUDE.md` (section
« Backend & données ») pour le schéma Supabase actuel.

## Prérequis

- Node.js ≥ 20
- pnpm (`corepack enable` ou `npm i -g pnpm`)

## Installation

```bash
pnpm install
```

## Lancement individuel des processus

`pnpm dev` à la racine lance les trois processus via Turborepo. Ou
individuellement, dans trois terminaux :

```bash
pnpm --filter @d-red/sync-server dev    # http://localhost:4000
pnpm --filter @d-red/donor-app dev      # http://localhost:3000
pnpm --filter @d-red/infrastructure dev # http://localhost:3001
```

## Vérifications

```bash
pnpm turbo run build lint type-check
```

### Tests d'intégration du Decision Engine

Avec le sync-server déjà démarré (`pnpm --filter @d-red/sync-server dev`) :

```bash
pnpm --filter @d-red/sync-server test:scenarios
```

Rejoue automatiquement les scénarios A-G, les Decision Policies (WC-03), le
Mode Démo et le Mode Autonome contre le serveur réel. ⚠️ Remet l'état à zéro
plusieurs fois pendant l'exécution — à ne pas lancer pendant une démo en
cours.

## Écrans

Voir `PROGRESS.md` pour l'inventaire complet des écrans (codes MD-*/WH-*/WC-*)
et leur état d'avancement, et `TODO.md` pour les fonctionnalités V2 non
couvertes par ce prototype.
