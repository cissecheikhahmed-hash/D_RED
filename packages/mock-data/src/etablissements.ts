import type { Etablissement, GroupeSanguin } from "@d-red/types";

/**
 * Stock complet à partir des seuls groupes disponibles (le reste à zéro).
 * Les groupes rares (O-, A-, B-, AB-) sont volontairement à zéro partout :
 * c'est la pénurie qui force le Decision Engine à basculer vers la
 * mobilisation donneur — le cœur de la démo.
 */
function stock(disponibles: Partial<Record<GroupeSanguin, number>>): Record<GroupeSanguin, number> {
  return {
    "O-": 0,
    "O+": 0,
    "A-": 0,
    "A+": 0,
    "B-": 0,
    "B+": 0,
    "AB-": 0,
    "AB+": 0,
    ...disponibles,
  };
}

export const etablissements: Etablissement[] = [
  {
    id: "etab_hopital_principal_dakar",
    nom: "Hôpital Principal de Dakar",
    type: "HOPITAL",
    ville: "Dakar",
    position: { lat: 14.6708, lng: -17.4358 },
    stockPoches: stock({ "A+": 2, "O+": 2, "B+": 1 }),
  },
  {
    id: "etab_cnts_dakar",
    nom: "CNTS — Centre National de Dakar",
    type: "BANQUE_DE_SANG",
    ville: "Dakar",
    position: { lat: 14.6937, lng: -17.4441 },
    stockPoches: stock({ "A+": 4, "O+": 3, "B+": 2, "AB+": 2 }),
  },
  {
    id: "etab_clinique_pasteur",
    nom: "Clinique Pasteur",
    type: "CLINIQUE_PRIVEE",
    ville: "Dakar",
    position: { lat: 14.6795, lng: -17.4529 },
    stockPoches: stock({ "A+": 1 }),
  },
  {
    id: "etab_hopital_thies",
    nom: "Hôpital Régional de Thiès",
    type: "HOPITAL",
    ville: "Thiès",
    position: { lat: 14.791, lng: -16.9359 },
    stockPoches: stock({ "O+": 1, "B+": 1 }),
  },
];
