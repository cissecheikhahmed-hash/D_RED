/** Niveau d'urgence d'une demande — pilote le comportement du Decision Engine simulé. */
export type NiveauUrgence = "STANDARD" | "PRIORITAIRE" | "CRITIQUE";

export const NIVEAU_URGENCE_LABELS: Record<NiveauUrgence, string> = {
  STANDARD: "Standard",
  PRIORITAIRE: "Prioritaire",
  CRITIQUE: "Critique",
};
