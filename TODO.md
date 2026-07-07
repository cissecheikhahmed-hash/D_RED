# TODO — V2 / hors périmètre de ce prototype

Fonctionnalités et cas identifiés pendant la conception mais volontairement
laissés hors du MVP démontrable (voir mémoire long-terme de l'assistant pour
le détail des décisions produit).

## Fonctionnalités produit

- **Récompenses / fidélisation** — seul un compteur simple de dons est
  implémenté (`Donneur.nombreDonsEffectues`). Le système de récompenses
  complet évoqué en Phase 2 n'est pas construit.
- **Documents** (nav donneur) — fonctionnalité mentionnée mais jamais
  clarifiée dans les phases de doc produit.
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
- Carte de guidage (MD-11) : illustration SVG simulée, jamais de tuiles
  réelles (décision volontaire, indépendance vis-à-vis du wifi en démo live).

## UI — prochaine passe (demandé par l'utilisateur, 2026-07-07)

- Ajouter de vraies illustrations (dessins représentatifs) ou images plutôt
  que les icônes Lucide/formes SVG minimalistes actuelles — notamment
  onboarding (MD-02), splash (MD-01), guidage (MD-11), clôture/gratification
  (MD-13). Explicitement mis de côté pour une passe UI ultérieure, pas pour
  maintenant.
