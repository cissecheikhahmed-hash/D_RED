import type { Etablissement } from "@d-red/types";

export const etablissements: Etablissement[] = [
  {
    id: "etab_hopital_principal_dakar",
    nom: "Hôpital Principal de Dakar",
    type: "HOPITAL",
    ville: "Dakar",
    position: { lat: 14.6708, lng: -17.4358 },
  },
  {
    id: "etab_cnts_dakar",
    nom: "CNTS — Centre National de Dakar",
    type: "BANQUE_DE_SANG",
    ville: "Dakar",
    position: { lat: 14.6937, lng: -17.4441 },
  },
  {
    id: "etab_clinique_pasteur",
    nom: "Clinique Pasteur",
    type: "CLINIQUE_PRIVEE",
    ville: "Dakar",
    position: { lat: 14.6795, lng: -17.4529 },
  },
  {
    id: "etab_hopital_thies",
    nom: "Hôpital Régional de Thiès",
    type: "HOPITAL",
    ville: "Thiès",
    position: { lat: 14.791, lng: -16.9359 },
  },
];
