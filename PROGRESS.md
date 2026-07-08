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

## Tests automatisés

Suite d'intégration (`apps/sync-server/scripts/test-scenarios.mjs`,
`pnpm --filter @d-red/sync-server test:scenarios`) : 38 assertions, tous les
scénarios A/B/C/D/E/F/G + Decision Policies + Mode Démo, rejouables en
quelques secondes contre le serveur réel — 38/38 au vert.

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
