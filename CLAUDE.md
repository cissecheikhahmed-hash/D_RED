# D.RED — Prototype haute-fidélité

## Contexte

D.RED (Digital Blood Response & Exchange Directory) coordonne hôpitaux, CNTS
et donneurs pour réduire le délai d'accès au sang. Ce dépôt est un
**prototype de démonstration** (hackathons, concours, pitchs partenaires) —
pas un produit de production. Il doit paraître réaliste sans implémenter une
architecture de production.

Cœur de la démo (Core Loop) : Hôpital crée une urgence → Decision Engine
(simulé) cherche une poche compatible → si indisponible ou trop lent → CNTS
mobilise un donneur → notification → acceptation → questionnaire rapide →
guidage → don validé par QR → résultats d'analyse.

## Ce qu'on ne construit jamais ici

Pas de vrai backend applicatif, pas de vraie authentification, pas de vraie
base de données, pas de vraie API de production, pas de vrais SMS/emails/
notifications push. Toutes les données et tous les changements d'état sont
simulés. La seule exception volontaire : `apps/sync-server` (voir ci-dessous)
est un vrai processus réseau, mais son contenu reste 100% éphémère et simulé.

**Si une consigne semble demander de réintroduire un vrai backend/DB/auth,
ne le fais pas silencieusement — signale la contradiction et attends
confirmation.** Ce point a déjà fait l'objet d'un aller-retour explicite avec
l'utilisateur ; l'architecture ci-dessous est la décision finale.

## Architecture (monorepo pnpm + Turborepo)

```
apps/
  donor-app/         # Next.js App Router, mobile-first (port 3000) — un seul acteur (Donneur)
  infrastructure/     # Next.js App Router (port 3001) — route groups (actors)/hospital et (actors)/cnts
  sync-server/        # Express + Socket.IO, store en mémoire (port 4000)
packages/
  ui/            # shadcn/ui + design tokens D.RED (styles/tokens.css)
  types/         # modèles de domaine partagés
  mock-data/     # jeux de données seed
  utils/         # helpers partagés (id, distance/ETA simulés, formatage)
  sync-client/   # wrapper socket.io-client + store Zustand partagé ("dredStore")
  tsconfig/      # tsconfig partagés (base/nextjs/node-library)
  eslint-config/ # config ESLint partagée
docs/
```

Donneur, Hôpital et CNTS sont trois acteurs réellement séparés dans la démo
(généralement 2-3 fenêtres/appareils ouverts en même temps). Le `sync-server`
est la seule source de vérité partagée : il détient l'état en mémoire, expose
des routes REST simples, et rediffuse chaque changement via Socket.IO à tous
les clients connectés. C'est aussi là que vit le **rythme temporisé** du
Decision Engine simulé (`setTimeout`/séquence d'événements) — jamais de
`setTimeout` local dans un composant pour simuler une étape métier
cross-acteur, sinon les fenêtres ouvertes se désynchronisent visiblement
pendant une démo live. Les petites animations purement locales (retour visuel
au clic, fondu) peuvent rester locales.

## Conventions de nommage — codes d'écran

Chaque écran a un code stable, utilisé comme nom de route/composant pour une
traçabilité 1:1 avec la documentation produit :

- **Donneur** (`apps/donor-app`) : MD-01 splash, MD-02 onboarding, MD-03
  téléphone, MD-04 OTP, MD-05 profil, MD-06 dashboard/veille, MD-07 fiche
  mission critique, **MD-08 questionnaire d'éligibilité rapide** (juste après
  acceptation, avant l'attente CNTS), MD-09 attente régulation, MD-11 guidage
  GPS + désengagement, MD-12 QR code, MD-13 clôture/gratification, MD-14
  historique. (MD-10 non utilisé.)
- **Hôpital** (`apps/infrastructure/app/(actors)/hospital`) : WH-01 connexion,
  WH-02 dashboard, WH-03 formulaire urgence éclair, WH-04 timeline temps réel,
  WH-05 scan réception QR.
- **CNTS** (`apps/infrastructure/app/(actors)/cnts`) : WC-01 dashboard
  supervision, WC-02 modale validation téléphonique, WC-03 configuration des
  policies du Decision Engine, WC-04 console labo & dispatch.

## Vocabulaire de statut (à utiliser tel quel dans `packages/types`)

Demande : `SCANNING_INFRAS` → `DONORS_NOTIFIED` → (donneur accepte, statut
mission côté donneur) `PRE_RESERVED` → (CNTS confirme) `EN_ROUTE` → arrivée →
don effectué → clôturée. Le niveau d'urgence (Standard / Prioritaire /
Critique) doit être un champ explicite de la demande dès WH-03 — c'est lui
qui pilote le comportement du Decision Engine (recherche séquentielle vs
simultanée infra+donneurs pour le niveau Critique).

## Stack technique

Next.js (App Router) / React / TypeScript strict · Tailwind CSS + Shadcn UI +
Lucide Icons · Zustand · React Hook Form + Zod · carte de navigation
**simulée** (SVG/illustration, pas de Leaflet/tuiles réelles — décision
délibérée pour ne jamais dépendre du wifi pendant une démo live) · QR code
généré côté client, purement visuel.

## Design system

Palette imposée (5 couleurs, voir `packages/ui/styles/tokens.css`) : noir
profond, rouge D.RED, blanc cassé, vert succès, orange attente. **Ce fichier
est la source de vérité actuelle** — des documents de design ultérieurs ont
proposé des variantes contradictoires (thème sombre avec valeurs hex
différentes vs thème clair ajoutant du bleu) ; aucune n'a encore été
confirmée comme remplacement. Ne pas changer la palette sans confirmation
explicite.

## Règles de qualité (non négociables)

- Composants réutilisables, séparation claire des responsabilités,
  composition plutôt qu'héritage, typage TypeScript strict, aucune
  duplication importante, code lisible.
- Ne jamais coder plusieurs fonctionnalités majeures en même temps — procéder
  par petites étapes ; à chaque étape, vérifier compilation, TypeScript,
  ESLint et responsive avant de continuer.
- Commenter uniquement quand ça apporte une vraie valeur (pourquoi, pas quoi).
- **Ne jamais modifier une fonctionnalité existante sans y être explicitement
  invité.**
- En cas d'ambiguïté : ne jamais inventer une fonctionnalité — signaler
  l'ambiguïté, proposer plusieurs solutions, recommander celle qui convient
  le mieux au prototype.
- Avant toute implémentation importante : proposer un plan et attendre
  validation.

## Où trouver le contexte produit

L'historique complet des décisions produit et d'architecture (les 7 phases de
documentation reçues, leurs contradictions et comment elles ont été
résolues) vit dans la mémoire long-terme de l'assistant, pas dans ce repo.
