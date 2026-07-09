# Avancement

État du prototype au 2026-07-07 : Core Loop complet, bout en bout, vérifié
manuellement (scénarios A et D) et via Mode Démo (pause/step/play/restart).

## Fondations

- [x] Design tokens D.RED (palette officielle de marque) + polices Poppins/Anton
- [x] `packages/types` — modèles de domaine, statuts canoniques
- [x] `packages/utils` — id, distance/ETA simulés, formatage FR
- [x] `packages/mock-data` — jeux de données seed (Dakar/Thiès)
- [x] `apps/sync-server` — Decision Engine simulé, Mode Démo, Decision Policies
- [x] `packages/sync-client` — store Zustand partagé + client Socket.IO
- [x] `packages/ui` — shadcn/ui (style base-nova) + tokens

## Écrans Donneur (`apps/donor-app`)

| Code  | Écran                              | État |
| ----- | ----------------------------------- | ---- |
| MD-01 | Splash                               | ✅ |
| MD-02 | Onboarding                           | ✅ |
| MD-03 | Téléphone                            | ✅ |
| MD-04 | OTP (simulé)                         | ✅ |
| MD-05 | Profil initial                       | ✅ |
| MD-06 | Dashboard / veille                   | ✅ |
| MD-07 | Fiche mission critique                | ✅ |
| MD-08 | Questionnaire d'éligibilité rapide    | ✅ |
| MD-09 | Attente régulation CNTS               | ✅ |
| MD-10 | Récompenses (paliers de fidélité)      | ✅ |
| MD-11 | Guidage GPS simulé + désengagement    | ✅ |
| MD-12 | QR code                               | ✅ |
| MD-13 | Clôture / gratification               | ✅ |
| MD-14 | Historique                            | ✅ |

## Écrans Établissement (`apps/infrastructure/app/(actors)/hospital`)

| Code  | Écran                          | État |
| ----- | -------------------------------- | ---- |
| WH-01 | Connexion (choix établissement)  | ✅ |
| WH-02 | Dashboard demandes                | ✅ |
| WH-03 | Formulaire urgence éclair          | ✅ |
| WH-04 | Timeline temps réel (séquentielle) | ✅ |
| WH-05 | Scan réception (confirmation manuelle) | ✅ |

Banque de sang et Clinique privée partagent ces mêmes écrans avec un
habillage distinct (icône + badge de type sur WH-02) — pas de duplication de
code.

## Écran Admin (`apps/infrastructure/app/(actors)/admin`)

| Code  | Écran                                        | État |
| ----- | ---------------------------------------------- | ---- |
| WA-01 | Vue d'ensemble nationale (lecture seule)         | ✅ |

⚠️ Convention `WA-*` introduite par l'assistant (aucun code d'écran Admin
n'existait dans la doc produit). Périmètre volontairement minimal et
lecture seule — voir `TODO.md`.

## Écrans CNTS (`apps/infrastructure/app/(actors)/cnts`)

| Code  | Écran                                  | État |
| ----- | ---------------------------------------- | ---- |
| WC-01 | Dashboard supervision nationale            | ✅ |
| WC-02 | Modale validation téléphonique              | ✅ |
| WC-03 | Decision Policies (délai de recherche)      | ✅ |
| WC-04 | Console labo & dispatch (don + bilan)       | ✅ |

## Scénarios de démo validés

- **A** — Succès complet via mobilisation donneur : validé de bout en bout.
- **B** — Premier donneur refuse, relance automatique vers le suivant : validé.
- **C** — Niveau Standard résolu par une poche infrastructure existante, aucun
  donneur jamais mobilisé (corrigé le 2026-07-07 — le moteur ne distinguait
  pas encore ce chemin) : validé.
- **D** — Donneur se désiste en route, re-recherche immédiate : validé.
- **F** — Rayon de mobilisation épuisé (plus aucun donneur compatible) :
  WH-04 affiche désormais un message explicite au lieu de rester figé sans
  explication (corrigé le 2026-07-07) : validé.
- **G** — Urgences concurrentes se disputant le même donneur : un donneur ne
  peut plus être notifié pour deux demandes actives en même temps, et
  redevient disponible dès `DONATION_COMPLETED` plutôt que de rester bloqué
  jusqu'à `CLOSED` (corrigé le 2026-07-07 — bug de double-réservation
  confirmé puis résolu) : validé.
- **J** — Reconnexion Socket.IO : détection de coupure confirmée (événement
  `disconnect` observé immédiatement), reconnexion automatique native de
  socket.io-client, resynchronisation complète de l'état à la reconnexion
  (le serveur ré-émet `state:sync` à chaque nouvelle connexion). Ajout d'une
  bannière visuelle "Connexion perdue — reconnexion en cours…" dans les deux
  apps, absente jusqu'ici : validé.
- **K** — États vides : nouveau composant `EmptyState` partagé
  (`@d-red/ui/components/empty-state`), utilisé dans WH-02, WC-01, WC-04
  (x2) et MD-14 à la place d'un simple texte : validé.
- **Mode Démo** — pause / step / play / restart : validé, désormais pilotable
  via un panneau présentateur dédié (`/demo` dans `apps/infrastructure`,
  jamais lié depuis une navigation visible) plutôt que par appel API brut.
- **E** — Niveau Critique notifie désormais 2 candidats simultanément ; WC-01/
  WC-02 affichent une vraie comparaison (les deux candidats, leur statut,
  leurs réponses) au lieu d'une popup à candidat unique. Le CNTS choisit
  lequel confirmer ; l'autre est éjecté automatiquement. `donneurAssigneId`
  n'est plus fixé à l'acceptation mais seulement à la confirmation CNTS
  (évite d'afficher côté hôpital un donneur "assigné" prématuré pendant la
  comparaison) : validé.
- **I** — Le Niveau Critique affiche désormais un rendu **parallèle** sur
  WH-04 pendant la phase de recherche (deux voies actives simultanément :
  "Recherche infrastructure" / "Recherche donneurs" avec la liste des
  candidats en cours), au lieu de la timeline séquentielle unique. Les
  autres niveaux restent séquentiels : validé.

Le filtre de rayon de mobilisation (`RADIUS_WAVES_KM`) est désormais
réellement branché dans le moteur (vagues progressives par niveau
d'urgence), vérifié avec des distances réalistes Dakar/Thiès.

Le cas H (voir `TODO.md`) reste bloqué : la doc produit ne définit jamais
la règle médicale nécessaire pour l'implémenter correctement.

## Vrai scan des infrastructures (2026-07-08)

La phase `SCANNING_INFRAS` n'est plus un simple minuteur : le Decision
Engine balaie réellement les établissements proches avant de mobiliser des
donneurs, conformément au Core Loop du brief (« cherche une poche
compatible → si indisponible ou trop lent → CNTS mobilise un donneur »).

- Chaque établissement a un **stock simulé de poches par groupe sanguin**
  (`Etablissement.stockPoches`, seed dans `packages/mock-data`). Les groupes
  rares (O-, A-, B-, AB-) sont à zéro partout : c'est la pénurie qui force
  la bascule donneurs, cœur de la démo.
- Le moteur vérifie les établissements **du plus proche au plus lointain**,
  une vérification à la fois, étalées sur la fenêtre WC-03
  (`dureeRechercheMsParNiveau`). Poche trouvée → stock décrémenté, source
  enregistrée (`sourcePocheEtablissementId`), demande `CLOSED`. Aucun stock
  nulle part → `notifierProchainDonneur`, **quel que soit le niveau, y
  compris STANDARD**.
- **Niveau Critique** : la recherche donneurs démarre pendant le scan
  (vraie recherche simultanée infra + donneurs). Si une poche est trouvée
  alors que des candidats sont notifiés/pré-réservés, la poche gagne et les
  candidats sont éjectés (même mécanique que le Scénario E). Une fois un
  donneur confirmé `EN_ROUTE`, le scan devient sans effet — on n'entre
  jamais dans le cas H bloqué (règle médicale non définie).
- **WH-04** affiche le balayage en direct (nom, distance, verdict par
  établissement) dans la timeline séquentielle comme dans la vue parallèle
  Critique, plus une carte « Poche fournie par … » quand l'issue est une
  poche. La piste courte « infra » n'est plus choisie par le niveau
  d'urgence mais par l'issue réelle de la demande.
- Le résultat n'est donc plus pré-déterminé par le niveau d'urgence : c'est
  le **stock** qui décide, le niveau ne pilote que le délai, les vagues de
  rayon et le séquentiel/parallèle. Scénario C inchangé en surface (AB+
  STANDARD trouve sa poche au CNTS), mais désormais par un vrai chemin.
- Suite d'intégration étendue : 43 → **55 assertions** (poche du plus
  proche en stock, décrément du stock, PRIORITAIRE résolu via infra,
  STANDARD qui bascule donneurs, recherche parallèle Critique). Reset des
  stocks gratuit à chaque `/demo/restart` (`structuredClone` du seed).

## Mode Autonome

Le serveur peut désormais tourner **sans aucune intervention humaine**
(toggle sur `/demo`) : il simule lui-même MD-07/MD-08 (accepte 80%/refuse
20%), WC-02 (confirme le premier candidat), WH-05 (scan réception) et WC-04
(don effectué + bilan), puis enchaîne une nouvelle demande aléatoire dès
qu'aucune n'est active — boucle infinie, idéale pour un stand sans
présentateur. Réutilise exactement les mêmes fonctions métier que les
routes HTTP (refactor `engine.ts`), aucune logique dupliquée.

Deux bugs de blocage trouvés et corrigés pendant le test en conditions
réelles (la boucle se figeait complètement sans eux) :
- Les demandes seed (`dem_1`/`dem_2`) sont de simples instantanés jamais
  passés par `demarrerDemande` — sans traitement dédié, elles restaient
  bloquées en `CREATED`/`SCANNING_INFRAS` pour toujours.
- Une demande dont le seul donneur compatible refuse (Scénario F, aucun
  autre candidat possible) restait bloquée en `DONORS_NOTIFIED` indéfiniment
  — le Mode Autonome l'abandonne désormais (clôture) pour ne pas bloquer le
  cycle suivant, alors qu'un vrai présentateur choisirait juste d'en créer
  une autre.

## Tests automatisés

Suite d'intégration (`apps/sync-server/scripts/test-scenarios.mjs`,
`pnpm --filter @d-red/sync-server test:scenarios`) : 43 assertions, tous les
scénarios A/B/C/D/E/F/G + Decision Policies + Mode Démo + Mode Autonome,
rejouables en quelques secondes contre le serveur réel — 43/43 au vert.

## Bugs trouvés et corrigés pendant la QA utilisateur

- MD-06 ne redirigeait que sur mission `NOTIFIED`, laissant le donneur
  bloqué si sa mission était déjà à un stade plus avancé.
- Peer dependencies manquantes de `@base-ui/react` (`date-fns`,
  `@date-fns/tz`), cause probable d'une erreur Turbopack observée en direct.
- Switch non contrôlé sur MD-06 (`defaultChecked` avec une valeur qui change
  après montage) — avertissement Base UI, corrigé en composant contrôlé.
- Select non contrôlé sur WH-03 (`groupeSanguin` sans valeur par défaut) —
  même classe de bug, même correctif.

## Illustrations

SVG dessinés à la main (`apps/donor-app/components/illustrations.tsx`) sur
MD-01 (logo goutte de sang), MD-02 (3 scènes onboarding), MD-11 (guidage
urbain), MD-13 (célébration) — aucune image externe, cohérent avec la
contrainte zéro dépendance réseau en démo live.

## Passe de polish pré-hackathon (2026-07-08)

Refonte visuelle sans toucher à la Core Loop ni au Decision Engine :

- **Badges sémantiques partagés** (`@d-red/ui/components/status-badges`) :
  urgence et statuts codés couleur sur la palette (Critique rouge pulsé,
  moteur actif orange animé, résolu vert), déployés sur WH-02/WH-04/WC-01/
  WC-02/WC-04/MD-14. Ajout du `@source` Tailwind vers `packages/ui/src`
  (sans lui, les classes du package n'étaient générées que par coïncidence).
- **App shell Infrastructure** (`components/app-shell.tsx`) : topbar de
  marque, identité de l'acteur, onglets, témoin temps réel, contenu centré.
  `useEtablissementSession` migré sur `useSyncExternalStore`.
- **Cadre téléphone** pour l'app Donneur sur desktop (plein écran sur mobile).
- **Dashboards** WH-02/WC-01/WA-01 : tuiles KPI (`StatCard`), horodatage
  relatif vivant (`useNow` + `formatRelativeTime`).
- **WH-04** : timeline verticale avec connecteurs, étape courante pulsée,
  horodatage réel de chaque étape — le moteur enregistre désormais l'heure
  d'entrée dans chaque statut (`changerStatutDemande`, `historiqueStatuts`).
- **États** : skeletons avant la première synchro (`pret`), succès verts
  (MD-13, WH-05), mentions « simulé » retirées des textes visibles.
- Typo `RecherchePorallele` corrigée, marque unifiée « D.RED », titres et
  espacements harmonisés. 43/43 tests toujours au vert après chaque étape.
- **Responsive mobile Infrastructure** : padding adaptatif (`p-4 sm:p-6`)
  sur toutes les pages acteurs, rangées de badges qui wrappent (WH-02,
  WC-01, WC-04), topbar compactée et onglets scrollables dans l'app shell.
- **MD-06** : une mission `ARRIVED` (QR déjà scanné) ne redirige plus vers
  MD-12 — elle enfermait le donneur dans la boucle MD-06 → MD-12 → MD-13
  jusqu'à la clôture CNTS ; le dashboard affiche à la place une carte
  « don en cours » avec lien volontaire.
- **Polish app Donneur (MD-01 → MD-14)** : coquille d'écran commune
  `Screen`/`ScreenHeader` (`components/screen.tsx`) à la place de la chaîne
  de classes copiée sur chaque page ; CTA principaux en `size="lg"` ;
  spinners sur les actions réseau (refus, désistement, questionnaire) ;
  vraies cases `Checkbox` shadcn sur MD-08 (au lieu des `<input>` natifs)
  avec libellés encadrés ; `GroupeSanguinTag`, `EmptyState`, `ProgressBar`
  et `DotBadge` du package UI réutilisés côté donneur ; distances/ETA
  formatés via `formatDistanceKm`/`formatEtaMinutes` ; OTP MD-04 à 4
  chiffres centrés (saisie numérique filtrée) ; MD-05 exige un nom avant de
  continuer ; illustrations SVG passées des hex codés en dur aux variables
  CSS de la palette ; thumb du Switch en blanc explicite (le
  `bg-background` crème le rendait invisible sur fond clair). Type-check,
  ESLint, build Next et 55/55 tests scénarios au vert.

## Séance de test manuelle post-polish (2026-07-08)

Séance guidée à 3 fenêtres (Hôpital / CNTS / Donneur) sur le build après la
passe de polish : Core Loop complète (WH-03 O- Critique → balayage infra →
mobilisation donneur → MD-07 acceptation → MD-08 → validation WC-02 →
guidage → QR → scan WH-05 → console WC-04 → MD-13/MD-14), plus les variantes
refus/désistement, résolution par stock (A+ Standard), éjection Scénario E
(O+ Critique en recherche parallèle), WC-03, WA-01 et Mode Autonome.
**Validée par l'utilisateur sans aucun bug remonté.**
