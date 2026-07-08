import type { GroupeSanguin } from "./donneur.js";
import type { NiveauUrgence } from "./urgence.js";

/** Produit sanguin demandé. */
export type ProduitSanguin = "SANG_TOTAL" | "PLASMA" | "PLAQUETTES" | "CONCENTRE_GLOBULAIRE";

export const PRODUIT_SANGUIN_LABELS: Record<ProduitSanguin, string> = {
  SANG_TOTAL: "Sang total",
  PLASMA: "Plasma",
  PLAQUETTES: "Plaquettes",
  CONCENTRE_GLOBULAIRE: "Concentré globulaire",
};

/**
 * Vocabulaire de statut imposé par le brief (CLAUDE.md), à utiliser tel quel.
 * CREATED précède SCANNING_INFRAS : la demande existe dès la soumission du
 * formulaire WH-03, avant même que le Decision Engine simulé ne démarre.
 */
export type DemandeStatus =
  | "CREATED"
  | "SCANNING_INFRAS"
  | "DONORS_NOTIFIED"
  | "PRE_RESERVED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "DONATION_COMPLETED"
  | "CLOSED";

export const DEMANDE_STATUS_LABELS: Record<DemandeStatus, string> = {
  CREATED: "Créée",
  SCANNING_INFRAS: "Recherche infrastructures",
  DONORS_NOTIFIED: "Donneurs notifiés",
  PRE_RESERVED: "Pré-réservé",
  EN_ROUTE: "En route",
  ARRIVED: "Arrivé",
  DONATION_COMPLETED: "Don effectué",
  CLOSED: "Clôturée",
};

/**
 * Résultat de la vérification d'un établissement pendant SCANNING_INFRAS.
 * Le Decision Engine balaie les établissements du plus proche au plus
 * lointain ; chaque étape est diffusée en direct pour être rendue sur WH-04.
 */
export type ScanInfraStatut = "EN_COURS" | "INDISPONIBLE" | "POCHE_TROUVEE";

export const SCAN_INFRA_STATUT_LABELS: Record<ScanInfraStatut, string> = {
  EN_COURS: "Vérification…",
  INDISPONIBLE: "Indisponible",
  POCHE_TROUVEE: "Poche trouvée",
};

export interface ScanInfraEtape {
  etablissementId: string;
  distanceKm: number;
  statut: ScanInfraStatut;
}

export interface Demande {
  id: string;
  etablissementId: string;
  groupeSanguin: GroupeSanguin;
  produit: ProduitSanguin;
  niveauUrgence: NiveauUrgence;
  status: DemandeStatus;
  createdAt: string;
  /** Renseigné une fois qu'un donneur est pré-réservé/assigné à la demande. */
  donneurAssigneId?: string;
  /**
   * Heure d'entrée dans chaque statut atteint (ISO), alimentée par le
   * sync-server — nourrit l'horodatage des étapes de la timeline WH-04.
   */
  historiqueStatuts?: Partial<Record<DemandeStatus, string>>;
  /** Balayage des établissements proches, du plus proche au plus lointain. */
  scanInfras?: ScanInfraEtape[];
  /** Renseigné quand la demande est résolue par une poche d'un établissement. */
  sourcePocheEtablissementId?: string;
}
