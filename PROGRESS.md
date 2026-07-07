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

Le filtre de rayon de mobilisation (`RADIUS_WAVES_KM`) est désormais
réellement branché dans le moteur (vagues progressives par niveau
d'urgence), vérifié avec des distances réalistes Dakar/Thiès.

Scénario E et les cas H–I (voir `TODO.md`) restent volontairement hors
périmètre.
