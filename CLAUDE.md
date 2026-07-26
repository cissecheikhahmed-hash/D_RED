# D.RED — Prototype haute-fidélité

## Contexte

D.RED (Digital Blood Response & Exchange Directory) coordonne hôpitaux, CNTS
et donneurs pour réduire le délai d'accès au sang.

**Pivot du 2026-07-26 (décision utilisateur explicite, remplace la décision
précédente conservée en historique ci-dessous) :** le projet passe de
prototype de démonstration à application de **production réelle**, mobile
(iOS/Android) + backend **Supabase**. Le monorepo web existant
(`apps/donor-app`, `apps/infrastructure`, `apps/sync-server`) reste la
référence fonctionnelle et UX (écrans, vocabulaire, Core Loop) mais n'est
plus la cible d'architecture finale.

Cœur du produit (Core Loop, inchangé fonctionnellement) : Hôpital crée une
urgence → Decision Engine cherche une poche compatible → si indisponible ou
trop lent → CNTS mobilise un donneur → notification → acceptation →
questionnaire rapide → guidage → don validé par QR → résultats d'analyse.

## Backend & données (mis à jour 2026-07-26)

**L'ancienne contrainte "zéro backend réel" (historique ci-dessous) est levée
par décision utilisateur explicite du 2026-07-26.** Elle avait fait l'objet
d'un aller-retour explicite et était jusque-là la décision finale ; elle ne
s'applique plus.

> Historique (jusqu'au 2026-07-26) : pas de vrai backend applicatif, pas de
> vraie authentification, pas de vraie base de données, pas de vraie API de
> production, pas de vrais SMS/emails/notifications push — tout simulé, seule
> exception volontaire `apps/sync-server` (process réseau réel mais état
> 100% éphémère).

Backend cible : **Supabase** (Postgres géré + auth + realtime).

Schéma posé le 2026-07-26 (état de départ, pas figé — à compléter au fur et
à mesure des décisions réelles, ne pas deviner au-delà) :
- Tables : `profiles`, `donors`, `facilities`, `blood_requests`.
- Enums : `user_role` (`DONOR`, `HOSPITAL`, `CNTS_ADMIN`), `blood_group`,
  `urgency_status`.
- Row Level Security (RLS) activée sur toutes les tables (policies non
  encore documentées ici).

**Toute nouvelle consigne qui semblerait réintroduire une simulation locale
là où Supabase doit maintenant faire autorité (auth, état des demandes,
stock) doit être signalée avant d'être appliquée — même logique de prudence
qu'avant le pivot, juste dans l'autre sens.**

## Architecture (monorepo pnpm + Turborepo)

```
apps/
  donor-app/         # Next.js App Router, mobile-first (port 3000) — un seul acteur (Donneur), web
  donor-mobile/      # Expo (React Native, TS) — Donneur mobile, connecté à Supabase (créé 2026-07-26)
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

**Web (existant — statut à réévaluer après le pivot du 2026-07-26)** :
Next.js (App Router) / React / TypeScript strict · Tailwind CSS + Shadcn UI +
Lucide Icons · Zustand · React Hook Form + Zod · carte de navigation MD-11 :
vraie carte Leaflet sur tuiles OSM pré-téléchargées et committées
(`apps/donor-app/public/tiles`, zone Dakar/Thiès, script
`apps/donor-app/scripts/download-tiles.mjs`) · QR code généré côté client,
purement visuel. La contrainte "aucune requête réseau pendant une démo live"
était liée au contexte démo/pitch et n'est pas automatiquement pertinente en
production mobile — ne pas la supposer applicable sans confirmation.

**Mobile** : React Native (Expo, TypeScript), app `@d-red/donor-mobile`
créée le 2026-07-26 dans `apps/donor-mobile` (template `blank-typescript`,
pas de navigation lib pour l'instant — un seul écran). Dépendances :
`@supabase/supabase-js`, `react-native-url-polyfill`,
`@react-native-async-storage/async-storage` (persistance de session auth).
Client Supabase dans `apps/donor-mobile/lib/supabase.ts`, lit
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` depuis
`apps/donor-mobile/.env` (non commité, voir `.env.example`). Écran
`screens/AuthScreen.tsx` : connexion/inscription email+mot de passe, juste
pour valider la liaison avec Supabase — pas encore les écrans MD-* réels.

Pas encore tranché : coexistence durable avec `apps/donor-app` web ou
remplacement à terme, package partagé pour le client Supabase entre apps
mobile/web (à côté ou à la place de `packages/sync-client`), navigation,
et comment `apps/donor-mobile` consomme `packages/types`/`packages/ui`. Ne
pas préjuger de ces choix avant qu'ils soient explicitement décidés.

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
