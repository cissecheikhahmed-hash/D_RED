import type { Demande, Mission } from "@d-red/types";
import { distanceKm, generateId } from "@d-red/utils";
import { store } from "./store.js";
import { demoClock } from "./demoClock.js";
import { broadcastState } from "./realtime.js";
import { policies } from "./policies.js";

const DELAI_RELANCE_MS = 1200;

export function demarrerDemande(demande: Demande): void {
  broadcastState();
  demoClock.schedule(() => {
    demande.status = "SCANNING_INFRAS";
    broadcastState();
    demoClock.schedule(() => {
      notifierProchainDonneur(demande.id);
    }, policies.dureeRechercheMsParNiveau[demande.niveauUrgence]);
  }, 500);
}

/**
 * Sélectionne le donneur vérifié disponible le plus proche, compatible avec
 * la demande, pas encore sollicité (ni refusé/éjecté/annulé) pour celle-ci.
 * Conformément à la résolution WC-02 (popup séquentiel unique), un seul
 * donneur est notifié à la fois — jamais une vague groupée.
 */
function trouverProchainCandidat(demande: Demande) {
  const etablissement = store.etablissements.find((e) => e.id === demande.etablissementId);
  if (!etablissement) return undefined;

  const missionsExistantes = store.missionsForDemande(demande.id);
  const donneursDejaSollicites = new Set(missionsExistantes.map((m) => m.donneurId));

  const candidats = store.donneurs
    .filter(
      (d) =>
        d.statutVerification === "VERIFIE" &&
        d.disponible &&
        d.groupeSanguin === demande.groupeSanguin &&
        !donneursDejaSollicites.has(d.id),
    )
    .map((d) => ({ donneur: d, distance: distanceKm(d.position, etablissement.position) }))
    .sort((a, b) => a.distance - b.distance);

  return candidats[0]?.donneur;
}

export function notifierProchainDonneur(demandeId: string): void {
  const demande = store.getDemande(demandeId);
  if (!demande) return;
  if (demande.status !== "SCANNING_INFRAS" && demande.status !== "DONORS_NOTIFIED") return;

  const candidat = trouverProchainCandidat(demande);
  if (!candidat) {
    // Aucun donneur trouvé dans le rayon disponible — la demande reste en recherche.
    demande.status = "DONORS_NOTIFIED";
    broadcastState();
    return;
  }

  const mission: Mission = {
    id: generateId("mis"),
    demandeId: demande.id,
    donneurId: candidat.id,
    status: "NOTIFIED",
    notifiedAt: new Date().toISOString(),
  };
  store.missions.push(mission);
  demande.status = "DONORS_NOTIFIED";
  broadcastState();
}

export function relancerApresRefusOuEjection(demandeId: string): void {
  demoClock.schedule(() => {
    notifierProchainDonneur(demandeId);
  }, DELAI_RELANCE_MS);
}
