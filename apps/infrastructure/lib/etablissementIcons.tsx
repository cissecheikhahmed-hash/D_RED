import { Building2, HeartPulse, Warehouse, type LucideIcon } from "lucide-react";
import type { TypeEtablissement } from "@d-red/types";

/**
 * Icône distinctive par type d'établissement — habillage visuel léger pour
 * Hôpital/Banque de sang/Clinique privée, qui partagent tous les mêmes
 * écrans WH-* (pas de portails dupliqués, cf. règle "aucune duplication
 * importante").
 */
export const ICONE_TYPE_ETABLISSEMENT: Record<TypeEtablissement, LucideIcon> = {
  HOPITAL: Building2,
  BANQUE_DE_SANG: Warehouse,
  CLINIQUE_PRIVEE: HeartPulse,
};
