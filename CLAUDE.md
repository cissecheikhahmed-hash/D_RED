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
  doctor-mobile/     # Expo (React Native, TS) — Médecin/CNTS mobile, connecté à Supabase (créé 2026-07-27)
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

**Mobile — Donneur** : React Native (Expo, TypeScript), app
`@d-red/donor-mobile` créée le 2026-07-26 dans `apps/donor-mobile` (template
`blank-typescript`, pas de navigation lib — écrans commutés par état local).
**Bug corrigé (2026-07-30) : PIN toujours refusé à la connexion.** La vraie
cause n'était ni le hachage (`lib/pin.ts` → `hashPin`/`isValidPin`, déjà
partagé et donc symétrique par construction entre inscription et
connexion) ni le type de colonne (le PIN est stocké haché dans
`auth.users.raw_user_meta_data.pin_hash`, JSONB — il n'y a pas de table
`profiles`/colonne `pin` dans ce projet) : `verify_signin_pin`
(migration 20260729) comparait `auth.users.phone` à `p_phone` par égalité
stricte, alors que GoTrue stocke `phone` **sans** le `+` initial que le
client envoie toujours (`normalizePhone`). La ligne n'était donc jamais
trouvée → `pin_hash` toujours `null` → PIN toujours refusé, quel que soit
le code saisi. Corrigé (migration `20260730_fix_pin_phone_matching.sql`)
en comparant uniquement les chiffres des deux côtés
(`regexp_replace(phone, '\D', '', 'g')`), insensible au `+`/espaces/tirets.
`lib/pin.ts` trime aussi désormais en interne (`hashPin`/`isValidPin`), une
seule fois, plutôt que dans chaque écran appelant.

Client Supabase dans `lib/supabase.ts` (**`persistSession: false`** — choix
volontaire du 2026-07-27 : l'utilisateur doit se ré-authentifier à chaque
lancement, pas de session restaurée automatiquement), lit
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` depuis `.env`
(non commité, voir `.env.example`). `screens/AuthScreen.tsx` : connexion +
inscription complète (email/mot de passe, prénom/nom, date de naissance
18+, groupe sanguin, sexe, date du dernier don), donnée stockée dans
`user_metadata` Supabase Auth (pas encore dans `profiles`/`donors` réels —
schéma toujours à confirmer). `screens/DonorDashboardScreen.tsx` :
éligibilité dynamique (3 mois femmes / 4 mois hommes), géolocalisation
(`expo-location`), section "Alertes & Demandes d'urgence reçues" (état vide
pour l'instant), et un pass QR chiffré (`components/QrPassModal.tsx` +
`lib/qrPass.ts`, AES via `crypto-js`, payload avec expiration 5 min). Le
compteur "Mon impact" (dons effectués / vies impactées) lit désormais le
vrai historique (`select count(*) from donations where donor_id = ...`,
RLS : le donneur ne lit que ses propres lignes) au lieu de l'ancien calcul
0/1 basé sur `last_donation_date` — table ajoutée à la publication
`supabase_realtime` (migration `20260730_donations_realtime.sql`) pour que
`components/DonationCelebrationModal.tsx` s'affiche automatiquement dès
que le médecin valide le don (RPC `validate_donation`, `ScanDonorModal`
côté doctor-mobile) : cœur battant + confettis (animations RN natives,
zéro dépendance ajoutée), message d'impact, compteurs à jour, bouton
"Partager mon impact" (`Share` natif de `react-native`). Comme pour les
autres flux, refetch complet du compte sur l'événement Realtime plutôt
qu'incrément local, pour rester source de vérité même en cas d'événement
manqué (donneur hors ligne au moment de la validation).
`components/CampaignsSection.tsx` et `components/EmergencyFeedSection.tsx`
sont maintenant toutes les deux branchées en Realtime Supabase
(`postgres_changes` sur `campaigns`/`emergency_alerts`) — une nouvelle
campagne/alerte apparaît sans remonter l'écran (`campaigns` ajoutée à la
publication `supabase_realtime`, voir migration
`20260730_doctor_dashboard_realtime.sql`). Le vrai bug "les campagnes ne
s'affichent pas" était en fait un filtrage client sur `radius_km` qui
masquait silencieusement toute campagne hors rayon test réaliste (corrigé
le 2026-07-30, `CampaignsSection.tsx`) : **le rayon (`radius_km`,
`campaigns` comme `emergency_alerts`) ne doit jamais servir à masquer une
ligne, seulement à trier/afficher** — même règle des deux côtés. Le groupe
sanguin suit une règle différente selon le flux : côté `campaigns`, badge
informatif seulement (jamais masqué) ; côté `emergency_alerts`, **filtre
strict** (une urgence dont aucun `blood_groups` ne correspond au groupe du
donneur est entièrement masquée — décision explicite du 2026-07-30, qui
remplace un choix antérieur de "badge seulement"). Quand un donneur accepte une
urgence (`components/EmergencyMissionModal.tsx`, "J'accepte la mission"),
l'insert dans `emergency_responses` dénormalise aussi un instantané du
donneur (prénom, nom, groupe sanguin, `session.user.phone`, position) —
nécessaire car le client médecin (clé anon) ne peut pas lire `auth.users`
d'un autre utilisateur ; pas de table `profiles`/`donors` lisible côté
médecin à ce jour.

**Mobile — Médecin/CNTS** : `@d-red/doctor-mobile` créée le 2026-07-27 dans
`apps/doctor-mobile`, mêmes conventions (Expo blank-typescript, pas de
persistance de session, `.env` non commité). `screens/AuthScreen.tsx` :
**connexion uniquement, pas d'auto-inscription** — les comptes
médecin/hôpital/CNTS ne doivent pas être créés en self-service comme les
donneurs (accès à des données médicales de tiers). `screens/
DoctorDashboardScreen.tsx` : deux actions, `components/CreateAlertModal.tsx`
(formulaire groupe sanguin/poches/rayon, **non persisté dans
`blood_requests`** — schéma non confirmé) et `components/ScanDonorModal.tsx`
(caméra `expo-camera`, déchiffre le pass donneur via `lib/qrPass.ts` +
calcule l'éligibilité via `lib/eligibility.ts`, dupliqué depuis
`donor-mobile` faute de package partagé). Le bouton "Valider ce don" met à
jour l'état local uniquement — **impossible en l'état d'écrire la vraie
date de dernier don du donneur dans Supabase depuis ce client** : les
champs donneur vivent dans `user_metadata` (modifiable seulement par
l'utilisateur lui-même via `auth.updateUser`), pas dans une table
`donors`/`profiles` avec policy RLS d'écriture pour les rôles
HOSPITAL/CNTS_ADMIN. Nécessite soit ces tables + policies, soit une
fonction serveur (Edge Function) avec service role.

**Vérification de rôle** : `DoctorDashboardScreen` lit
`user_metadata.role` (`HOSPITAL`/`CNTS_ADMIN`) et affiche un bandeau
d'avertissement si absent/différent, mais ne bloque pas l'accès — c'est de
la UX, pas un contrôle de sécurité réel (contournable côté client). Aucun
compte n'a de `role` positionné aujourd'hui (le flux d'inscription donneur
n'en écrit pas), donc ce bandeau s'affichera systématiquement tant que le
provisioning des comptes médicaux n'est pas défini.

**Fiche établissement (2026-07-30)** : le médecin ne saisit plus jamais le
nom/l'adresse de son hôpital dans `CampaignModal.tsx`/`EmergencyAlertModal.tsx`
(champ retiré, ainsi que `lib/location.ts`/`getCurrentCoords` — supprimé,
plus aucun appel GPS côté médecin pour ces formulaires). À la place,
`lib/hospital.ts` (`getHospitalProfile`) lit `hospital_name` /
`hospital_address` / `hospital_lat` / `hospital_lng` depuis
`user_metadata` — même mécanisme que `role`, pas de table
`hospitals`/`profiles`. Ces champs sont pré-configurés par le CNTS à la
création du compte (`scripts/create-demo-account.mjs` les fixe/rétablit,
y compris sur un compte démo déjà existant via sign-in + `updateUser`) ;
il n'existe pas encore d'écran d'administration CNTS pour les gérer sur de
vrais comptes. Si absents, `DoctorDashboardScreen` affiche un bandeau
d'avertissement et désactive les deux actions de création (campagne /
urgence) plutôt que de les laisser échouer silencieusement à la
soumission. `CampaignModal.tsx` collecte désormais une heure de début et
une heure de fin (en plus des dates déjà présentes), fusionnées dans
`scheduled_at`/`ends_at` — auparavant calées à minuit.

**Tableau de bord temps réel du médecin (2026-07-30)** :
`components/EmergencyResponsesPanel.tsx` (dans `DoctorDashboardScreen`,
section "Missions en cours") liste les alertes `OPEN` créées par le
médecin connecté et leurs réponses (`emergency_responses`), avec
réabonnement Realtime (`postgres_changes` sur `emergency_responses` et
`emergency_alerts`, sans filtre serveur — même choix volontaire que
`EmergencyFeedSection` côté donneur) : dès qu'un donneur accepte, sa
fiche (nom, groupe, distance calculée via `lib/distance.ts` dupliqué
depuis donor-mobile) apparaît sans action du médecin. Bouton "Appeler le
donneur" : `Linking.openURL('tel:...')` sur `donor_phone` dénormalisé.
Bouton "Alerte satisfaite — prévenir les autres donneurs" : passe
`emergency_alerts.status` à `CLOSED` (nouvelle policy UPDATE réservée au
créateur, migration `20260730_doctor_dashboard_realtime.sql`) — c'est ce
qui retire réellement l'alerte de l'écran des autres donneurs en temps
réel (filtre `status = 'OPEN'` + Realtime déjà en place côté
`EmergencyFeedSection`). Le bouton met aussi en file des lignes
`sms_notifications` pour les répondants (nouvelle policy INSERT réservée
au créateur de l'alerte concernée) mais **aucun envoi réel n'est
implémenté** (toujours pas de job serveur/Twilio) : c'est la clôture de
l'alerte, pas la file SMS, qui produit l'effet visible.

**Compte de démo (2026-07-27)** : `apps/doctor-mobile/scripts/
create-demo-account.mjs` (`pnpm --filter @d-red/doctor-mobile seed:demo`)
crée `demo.cnts@d-red.test` avec `role: CNTS_ADMIN` via l'anon key — un
vrai compte dans le projet Supabase, pas une simulation. L'écran de
connexion a un bouton "Remplir avec le compte démo" qui pré-remplit ces
identifiants, visible uniquement en dev (`__DEV__`) : des identifiants en
dur ne doivent jamais être accessibles dans un build de production.

**Secret partagé `EXPO_PUBLIC_QR_PASS_SECRET`** : doit être identique dans
`apps/donor-mobile/.env` et `apps/doctor-mobile/.env` pour que le
déchiffrement fonctionne. Étant `EXPO_PUBLIC_*`, il est embarqué dans les
deux bundles clients et donc extractible — protège seulement contre un scan
grand public, pas contre un attaquant qui décompile l'une des deux apps.
Une vraie confidentialité nécessiterait un chiffrement asymétrique ou une
fonction serveur détenant le secret.

Pas encore tranché : coexistence durable des apps mobiles avec `apps/
donor-app`/`apps/infrastructure` web ou remplacement à terme, package
partagé pour le client Supabase et la logique d'éligibilité entre apps
mobiles (actuellement dupliquée), et comment ces apps consomment
`packages/types`/`packages/ui`. Ne pas préjuger de ces choix avant qu'ils
soient explicitement décidés.

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
