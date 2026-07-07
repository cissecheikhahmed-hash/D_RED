import type { Mission } from "@d-red/types";
import { ilYA } from "./temps.js";

/**
 * Historique de missions cohérent avec `demandes.ts`. dem_3 illustre le
 * scénario B (un premier donneur refuse, la vague continue vers le suivant).
 */
export const missions: Mission[] = [
  {
    id: "mis_dem3_moussa",
    demandeId: "dem_3",
    donneurId: "don_moussa_diop",
    status: "REFUSED",
    notifiedAt: ilYA(4),
  },
  {
    id: "mis_dem3_fatou",
    demandeId: "dem_3",
    donneurId: "don_fatou_sow",
    status: "NOTIFIED",
    notifiedAt: ilYA(3),
  },
  {
    id: "mis_dem4_aissatou",
    demandeId: "dem_4",
    donneurId: "don_aissatou_ba",
    status: "PRE_RESERVED",
    notifiedAt: ilYA(8),
    questionnaire: {
      dateDernierDon: ilYA(60 * 24 * 90),
      voyageRecent: false,
      traitementEnCours: false,
      seSentBien: true,
    },
  },
  {
    id: "mis_dem5_khady",
    demandeId: "dem_5",
    donneurId: "don_khady_fall",
    status: "EN_ROUTE",
    notifiedAt: ilYA(15),
    questionnaire: {
      dateDernierDon: ilYA(60 * 24 * 120),
      voyageRecent: false,
      traitementEnCours: false,
      seSentBien: true,
    },
  },
  {
    id: "mis_dem6_fatou",
    demandeId: "dem_6",
    donneurId: "don_fatou_sow",
    status: "ARRIVED",
    notifiedAt: ilYA(40),
    questionnaire: {
      dateDernierDon: ilYA(60 * 24 * 45),
      voyageRecent: false,
      traitementEnCours: false,
      seSentBien: true,
    },
  },
  {
    id: "mis_dem7_moussa",
    demandeId: "dem_7",
    donneurId: "don_moussa_diop",
    status: "DONATION_COMPLETED",
    notifiedAt: ilYA(70),
    questionnaire: {
      dateDernierDon: null,
      voyageRecent: false,
      traitementEnCours: false,
      seSentBien: true,
    },
  },
  {
    id: "mis_dem8_ibrahima",
    demandeId: "dem_8",
    donneurId: "don_ibrahima_ndiaye",
    status: "DONATION_COMPLETED",
    notifiedAt: ilYA(150),
    questionnaire: {
      dateDernierDon: ilYA(60 * 24 * 200),
      voyageRecent: false,
      traitementEnCours: false,
      seSentBien: true,
    },
  },
];
