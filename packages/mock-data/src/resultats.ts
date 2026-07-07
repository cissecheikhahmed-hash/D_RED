import type { ResultatAnalyse } from "@d-red/types";
import { ilYA } from "./temps.js";

export const resultats: ResultatAnalyse[] = [
  {
    id: "res_dem7_moussa",
    missionId: "mis_dem7_moussa",
    donneurId: "don_moussa_diop",
    envoyeAt: ilYA(65),
    canalEnvoiSimule: "Bilan envoyé à m***@exemple.sn (lien chiffré)",
  },
  {
    id: "res_dem8_ibrahima",
    missionId: "mis_dem8_ibrahima",
    donneurId: "don_ibrahima_ndiaye",
    envoyeAt: ilYA(145),
    canalEnvoiSimule: "Bilan envoyé à i***@exemple.sn (lien chiffré)",
  },
];
