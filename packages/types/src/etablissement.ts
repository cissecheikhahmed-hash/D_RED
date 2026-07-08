import type { GroupeSanguin } from "./donneur.js";

/**
 * Rôle "demandeur" généralisé : le prototype ne construit qu'un seul jeu
 * d'écrans (WH-*) pour toute structure qui émet une demande de sang, plutôt
 * que des portails dédiés par type. Le champ `type` permet de représenter
 * Hôpital / Banque de sang / Clinique privée avec les mêmes écrans.
 */
export type TypeEtablissement = "HOPITAL" | "BANQUE_DE_SANG" | "CLINIQUE_PRIVEE";

export const TYPE_ETABLISSEMENT_LABELS: Record<TypeEtablissement, string> = {
  HOPITAL: "Hôpital",
  BANQUE_DE_SANG: "Banque de sang",
  CLINIQUE_PRIVEE: "Clinique privée",
};

export interface Etablissement {
  id: string;
  nom: string;
  type: TypeEtablissement;
  ville: string;
  /** Position simulée (coordonnées fictives, pas de vraie géolocalisation). */
  position: { lat: number; lng: number };
  /**
   * Poches disponibles par groupe sanguin (stock simulé). C'est lui que le
   * Decision Engine consulte pendant SCANNING_INFRAS ; une poche trouvée le
   * décrémente.
   */
  stockPoches: Record<GroupeSanguin, number>;
}
