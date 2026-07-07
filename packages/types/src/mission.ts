/**
 * Suivi du parcours d'un donneur mobilisé sur une demande donnée. Distincte
 * de `DemandeStatus` : plusieurs donneurs peuvent être notifiés pour la
 * même demande, chacun avec sa propre Mission, mais une seule finira
 * PRE_RESERVED puis EN_ROUTE (les autres sont REFUSED/EJECTED).
 *
 * Refus explicite (bouton "Refuser") et absence de réponse (timeout) sont
 * traités identiquement : les deux font passer la Mission à REFUSED et
 * déclenchent la relance vers le donneur suivant.
 */
export type MissionStatus =
  | "NOTIFIED"
  | "REFUSED"
  | "PRE_RESERVED"
  | "EJECTED"
  | "EN_ROUTE"
  | "CANCELLED"
  | "ARRIVED"
  | "DONATION_COMPLETED";

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  NOTIFIED: "Notifié",
  REFUSED: "Refusé",
  PRE_RESERVED: "Pré-réservé",
  EJECTED: "Éjecté",
  EN_ROUTE: "En route",
  CANCELLED: "Annulé",
  ARRIVED: "Arrivé",
  DONATION_COMPLETED: "Don effectué",
};

export interface Mission {
  id: string;
  demandeId: string;
  donneurId: string;
  status: MissionStatus;
  notifiedAt: string;
  /** Réponses au questionnaire MD-08, disponibles dès PRE_RESERVED pour l'arbitrage CNTS (WC-02). */
  questionnaire?: {
    dateDernierDon: string | null;
    voyageRecent: boolean;
    traitementEnCours: boolean;
    seSentBien: boolean;
  };
}
