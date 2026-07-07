import type { NiveauUrgence } from "@d-red/types";

/**
 * Paramètres du Decision Engine simulé, éditables depuis WC-03 sans
 * redéploiement — seul le délai de recherche infrastructure est réellement
 * branché sur le moteur (les rayons de vague ne gatent pas la sélection de
 * donneur dans cette simulation, voir engine.ts).
 */
export const policies: { dureeRechercheMsParNiveau: Record<NiveauUrgence, number> } = {
  dureeRechercheMsParNiveau: {
    STANDARD: 4000,
    PRIORITAIRE: 3000,
    CRITIQUE: 1500,
  },
};
