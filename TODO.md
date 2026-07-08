# TODO — V2 / hors périmètre de ce prototype

Fonctionnalités et cas identifiés pendant la conception mais volontairement
laissés hors du MVP démontrable (voir mémoire long-terme de l'assistant pour
le détail des décisions produit).

## Fonctionnalités produit

- **Documents** (nav donneur) — fonctionnalité mentionnée mais jamais
  clarifiée dans les phases de doc produit.
- **Récompenses (partie construite le 2026-07-08)** : paliers de fidélité
  (Bronze/Argent/Or/Platine) calculés à partir de `nombreDonsEffectues`,
  écran MD-10. Reste hors périmètre : notifications de changement de palier,
  vraies récompenses/avantages concrets (ce ne sont que des badges visuels).
- **Portails dédiés Banque de sang / Clinique privée / Admin** — le rôle
  "Établissement" est généralisé (champ `type`) et couvert par les mêmes
  écrans WH-*. Des portails/écrans réellement distincts par type, et un rôle
  Admin à part entière, restent à concevoir si le produit réel les requiert.
- **Partenaires / Campagnes** (`Partenaire`, `Campagne`) — entités décrites en
  Phase 2, gérées côté CNTS, absentes de ce prototype.

## Scénarios de test non couverts

- **E** — Plusieurs donneurs acceptent simultanément ; WC-02 reste une popup
  séquentielle (un seul candidat à la fois), pas de comparaison multi-donneurs.
- **H** — Une poche devient disponible pendant qu'un donneur est déjà en
  route : règle de coupure médicale toujours non définie par le produit.
- **I** — Recherche simultanée infra+donneurs du Niveau Critique : la
  timeline WH-04 reste volontairement séquentielle (décision produit), donc
  jamais représentée visuellement comme "simultanée".

## Decision Engine

- **Re-notification différée** — quand une demande B ne trouve aucun candidat
  parce que l'unique donneur compatible est occupé sur une demande A (Scénario
  G), B reste figée en `DONORS_NOTIFIED` même une fois ce donneur libéré : rien
  ne "réveille" B automatiquement. Il faudrait, à chaque libération d'un
  donneur (refus/éjection/annulation/don complété), rebalayer les demandes en
  recherche sans candidat actif plutôt que de ne relancer que la demande
  d'origine.

## Autres

- QR code : reste purement visuel (`qrcode.react`), aucune vraie lecture
  caméra côté hôpital (décision volontaire du brief).
- **Carte de guidage (MD-11) — changement de décision demandé le 2026-07-08** :
  l'utilisateur veut à terme une **vraie carte** de la zone (pas l'illustration
  SVG simulée), malgré le risque de dépendance réseau pendant une démo live.
  Ceci renverse la décision "carte simulée" documentée dans `CLAUDE.md` et
  actée à plusieurs reprises précédemment — à ne pas appliquer sans repasser
  par `CLAUDE.md` d'abord (le brief y fait explicitement référence comme
  "décision finale"). Résolution convenue avec l'utilisateur : carte réelle
  **avec un fallback local/en cache de la zone de démo** (ex. tuiles
  pré-téléchargées ou capture statique de Dakar/Thiès) pour ne pas dépendre
  d'une vraie connexion pendant la présentation. Explicitement mis de côté
  pour plus tard, pas pour l'instant.

## CI

- Le workflow `.github/workflows/ci.yml` existe et a été vérifié en rejouant
  chaque étape localement, mais **aucun dépôt GitHub distant n'est encore
  configuré** — la CI ne s'activera qu'après un premier `git push` vers
  GitHub.
