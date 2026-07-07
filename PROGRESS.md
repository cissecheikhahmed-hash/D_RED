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
- **D** — Donneur se désiste en route, re-recherche immédiate : validé.
- **Mode Démo** — pause / step / play / restart : validé.

Scénarios C, E et les cas F–K (voir `TODO.md`) restent à exercer/affiner.
