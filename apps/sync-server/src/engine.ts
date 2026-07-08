import type { Demande, Mission, MissionStatus, NiveauUrgence } from "@d-red/types";
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
 * Nombre de candidats notifiés simultanément par demande. Le Niveau Critique
 * cherche infrastructure ET donneurs "simultanément" (Phase 2) : on traduit
 * ça en contactant 2 donneurs à la fois plutôt qu'un seul en séquence — le
 * premier qui est confirmé par le CNTS (WC-02) l'emporte, les autres sont
 * éjectés (Scénario E). Les niveaux Standard/Prioritaire restent séquentiels
 * (un candidat à la fois), moins urgents.
 */
const CANDIDATS_SIMULTANES: Record<NiveauUrgence, number> = {
  STANDARD: 1,
  PRIORITAIRE: 1,
  CRITIQUE: 2,
};

/**
 * Statuts qui excluent définitivement un donneur d'être re-sollicité pour
 * CETTE demande — uniquement quand c'est SA propre décision (refus,
 * désistement) ou qu'il est toujours actif dessus. EJECTED est
 * volontairement absent : avec 2 candidats simultanés (Critique), un
 * donneur éjecté ne l'est que parce qu'un concurrent a été confirmé en
 * premier, pas par choix — il redevient un candidat valable si le donneur
 * confirmé se désiste ensuite (Scénario D + E combinés).
 */
const STATUTS_EXCLUANT_RESOLLICITATION = new Set<MissionStatus>([
  "NOTIFIED",
  "PRE_RESERVED",
  "EN_ROUTE",
  "ARRIVED",
  "DONATION_COMPLETED",
  "REFUSED",
  "CANCELLED",
]);

/**
 * Sélectionne le donneur vérifié disponible compatible avec la demande, pas
 * encore sollicité (ni refusé ni annulé) pour celle-ci, en respectant
 * les vagues de rayon progressives (WC-03/Phase 2) : on prend le plus proche
 * dans la plus petite vague qui contient au moins un candidat, plutôt que
 * le plus proche absolu sans limite de distance.
 */
function trouverProchainCandidat(demande: Demande) {
  const etablissement = store.etablissements.find((e) => e.id === demande.etablissementId);
  if (!etablissement) return undefined;

  const missionsExistantes = store.missionsForDemande(demande.id);
  const donneursDejaSollicites = new Set(
    missionsExistantes
      .filter((m) => STATUTS_EXCLUANT_RESOLLICITATION.has(m.status))
      .map((m) => m.donneurId),
  );

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

/**
 * Complète le nombre de candidats activement notifiés jusqu'à la cible du
 * niveau d'urgence (2 pour Critique, 1 sinon) — pas une notification isolée.
 * Appelée aussi bien à la recherche initiale qu'après un refus/éjection
 * (relance), elle ne fait rien si la cible est déjà atteinte.
 */
export function notifierProchainDonneur(demandeId: string): void {
  const demande = store.getDemande(demandeId);
  if (!demande) return;
  if (demande.status !== "SCANNING_INFRAS" && demande.status !== "DONORS_NOTIFIED") return;

  const cible = CANDIDATS_SIMULTANES[demande.niveauUrgence];
  let actifs = store.missionsForDemande(demande.id).filter((m) => m.status === "NOTIFIED").length;

  while (actifs < cible) {
    const candidat = trouverProchainCandidat(demande);
    if (!candidat) break;

    const mission: Mission = {
      id: generateId("mis"),
      demandeId: demande.id,
      donneurId: candidat.id,
      status: "NOTIFIED",
      notifiedAt: new Date().toISOString(),
    };
    store.missions.push(mission);
    actifs++;
  }

  demande.status = "DONORS_NOTIFIED";
  broadcastState();
}

export function relancerApresRefusOuEjection(demandeId: string): void {
  demoClock.schedule(() => {
    notifierProchainDonneur(demandeId);
  }, DELAI_RELANCE_MS);
}
