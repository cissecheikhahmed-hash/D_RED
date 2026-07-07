export type GroupeSanguin =
  | "O-"
  | "O+"
  | "A-"
  | "A+"
  | "B-"
  | "B+"
  | "AB-"
  | "AB+";

/** Canal d'alerte préféré du donneur — affichage/simulation uniquement, aucune notification réelle envoyée. */
export type CanalAlerte = "PUSH" | "APPEL" | "SMS";

/**
 * Un compte devient "donneur vérifié" (éligible à la mobilisation opérationnelle)
 * uniquement après validation en personne par un professionnel de santé lors
 * d'un don, d'une campagne ou d'un dépistage — jamais à l'inscription.
 */
export type StatutVerification = "NON_VERIFIE" | "VERIFIE";

export interface Donneur {
  id: string;
  nom: string;
  telephone: string;
  groupeSanguin: GroupeSanguin;
  canalAlertePrefere: CanalAlerte;
  statutVerification: StatutVerification;
  disponible: boolean;
  /** Position simulée (coordonnées fictives, pas de vraie géolocalisation). */
  position: { lat: number; lng: number };
  /** Compteur simple de dons effectués — pas de système Récompenses complet dans ce prototype. */
  nombreDonsEffectues: number;
}
