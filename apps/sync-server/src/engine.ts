import type { Demande, Mission, MissionStatus } from "@d-red/types";
import { distanceKm, generateId, RADIUS_WAVES_KM } from "@d-red/utils";
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
      // Niveau Standard : recherche infrastructure uniquement (Phase 2) —
      // une poche compatible est toujours trouvée, aucun donneur n'est
      // jamais mobilisé. C'est le second "happy path" (Scénario C),
      // distinct de la mobilisation donneur des niveaux Prioritaire/Critique.
      if (demande.niveauUrgence === "STANDARD") {
        demande.status = "CLOSED";
        broadcastState();
        return;
      }
      notifierProchainDonneur(demande.id);
    }, policies.dureeRechercheMsParNiveau[demande.niveauUrgence]);
  }, 500);
}

/**
 * Statuts de mission qui gardent le donneur occupé pour toute autre demande.
 * Le don s'arrête d'occuper le donneur dès DONATION_COMPLETED (physiquement
 * terminé) — CLOSED n'est qu'administratif (bilan envoyé) et n'a pas besoin
 * d'être atteint pour le libérer.
 */
const STATUTS_MISSION_OCCUPANTS = new Set<MissionStatus>([
  "NOTIFIED",
  "PRE_RESERVED",
  "EN_ROUTE",
  "ARRIVED",
]);

/**
 * Un donneur déjà engagé sur une AUTRE demande (Scénario G — urgences
 * concurrentes) ne doit jamais être sollicité une seconde fois tant que
 * cet engagement n'est pas résolu.
 */
function donneurOccupeAilleurs(donneurId: string, demandeId: string): boolean {
  return store.missions.some(
    (m) =>
      m.donneurId === donneurId &&
      m.demandeId !== demandeId &&
      STATUTS_MISSION_OCCUPANTS.has(m.status),
  );
}

/**
 * Sélectionne le donneur vérifié disponible compatible avec la demande, pas
 * encore sollicité (ni refusé/éjecté/annulé) pour celle-ci, en respectant
 * les vagues de rayon progressives (WC-03/Phase 2) : on prend le plus proche
 * dans la plus petite vague qui contient au moins un candidat, plutôt que
 * le plus proche absolu sans limite de distance. Conformément à la
 * résolution WC-02 (popup séquentiel unique), un seul donneur est notifié
 * à la fois — jamais une vague groupée de plusieurs candidats.
 */
function trouverProchainCandidat(demande: Demande) {
  const etablissement = store.etablissements.find((e) => e.id === demande.etablissementId);
  if (!etablissement) return undefined;

  const missionsExistantes = store.missionsForDemande(demande.id);
  const donneursDejaSollicites = new Set(missionsExistantes.map((m) => m.donneurId));

  const eligibles = store.donneurs
    .filter(
      (d) =>
        d.statutVerification === "VERIFIE" &&
        d.disponible &&
        d.groupeSanguin === demande.groupeSanguin &&
        !donneursDejaSollicites.has(d.id) &&
        !donneurOccupeAilleurs(d.id, demande.id),
    )
    .map((d) => ({ donneur: d, distance: distanceKm(d.position, etablissement.position) }))
    .sort((a, b) => a.distance - b.distance);

  for (const rayonKm of RADIUS_WAVES_KM[demande.niveauUrgence]) {
    const candidat = eligibles.find((c) => c.distance <= rayonKm);
    if (candidat) return candidat.donneur;
  }
  return undefined;
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
