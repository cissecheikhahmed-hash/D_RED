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

- **C** — Poche infra trouvée rapidement, aucun donneur mobilisé (second
  chemin heureux, distinct du scénario A).
- **E** — Plusieurs donneurs acceptent simultanément ; WC-02 reste une popup
  séquentielle (un seul candidat à la fois), pas de comparaison multi-donneurs.
- **F** — Rayon de mobilisation épuisé, aucun donneur trouvé : le serveur
  laisse la demande en `DONORS_NOTIFIED` sans candidat ; aucun écran dédié
  n'explique cet état à l'hôpital/CNTS.
- **G** — Urgences concurrentes de plusieurs hôpitaux se disputant le même
  bassin de donneurs.
- **H** — Une poche devient disponible pendant qu'un donneur est déjà en
  route : règle de coupure médicale toujours non définie par le produit.
- **I** — Recherche simultanée infra+donneurs du Niveau Critique : la
  timeline WH-04 reste volontairement séquentielle (décision produit), donc
  jamais représentée visuellement comme "simultanée".
- **J** — Reconnexion Socket.IO après coupure réseau pendant une démo
  multi-fenêtres.
- **K** — États vides des dashboards (WH-02/WC-01) : gérés a minima par un
  message texte, pas de traitement visuel dédié.

## Decision Engine

- Les rayons de vague (`RADIUS_WAVES_KM` dans `packages/utils`) sont définis
  mais **non branchés** comme filtre réel dans `apps/sync-server/src/engine.ts` :
  le moteur sélectionne aujourd'hui le donneur vérifié disponible le plus
  proche, sans plafond de distance. Seul le délai de recherche infrastructure
  est réellement configurable (WC-03).

## Autres

- QR code : reste purement visuel (`qrcode.react`), aucune vraie lecture
  caméra côté hôpital (décision volontaire du brief).
- Carte de guidage (MD-11) : illustration SVG simulée, jamais de tuiles
  réelles (décision volontaire, indépendance vis-à-vis du wifi en démo live).
