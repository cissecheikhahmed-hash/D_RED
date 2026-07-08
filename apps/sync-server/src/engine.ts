import type {
  Demande,
  DemandeStatus,
  Donneur,
  Etablissement,
  Mission,
  MissionStatus,
  NiveauUrgence,
  ScanInfraEtape,
} from "@d-red/types";
import { distanceKm, generateId, RADIUS_WAVES_KM } from "@d-red/utils";
import { store } from "./store.js";
import { demoClock } from "./demoClock.js";
import { broadcastState } from "./realtime.js";
import { policies } from "./policies.js";

const DELAI_RELANCE_MS = 1200;

/**
 * Unique point de passage des transitions de statut d'une demande : mémorise
 * l'heure d'entrée dans chaque statut (timeline WH-04). Un simple re-passage
 * par le même statut (ex. top-up de candidats en DONORS_NOTIFIED) ne bouge
 * pas l'horodatage.
 */
export function changerStatutDemande(demande: Demande, status: DemandeStatus): void {
  if (demande.status !== status) {
    (demande.historiqueStatuts ??= {})[status] = new Date().toISOString();
  }
  demande.status = status;
}

/**
 * Niveau Critique : la recherche donneurs démarre pendant le scan des
 * infrastructures (recherche simultanée, Phase 2) au lieu d'attendre son
 * épuisement. Légèrement différée pour rester une étape distincte du
 * pas-à-pas du Mode Démo.
 */
const DELAI_RECHERCHE_PARALLELE_MS = 600;

export function demarrerDemande(demande: Demande): void {
  broadcastState();
  demoClock.schedule(() => {
    changerStatutDemande(demande, "SCANNING_INFRAS");
    broadcastState();
    lancerScanInfrastructures(demande.id);
    if (demande.niveauUrgence === "CRITIQUE") {
      demoClock.schedule(() => notifierProchainDonneur(demande.id), DELAI_RECHERCHE_PARALLELE_MS);
    }
  }, 500);
}

/**
 * Statuts pendant lesquels le scan des infrastructures reste pertinent :
 * une poche trouvée peut encore résoudre la demande, même si des donneurs
 * sont déjà notifiés ou pré-réservés (recherche parallèle du Niveau
 * Critique — les candidats sont alors éjectés). Dès qu'un donneur est
 * confirmé EN_ROUTE, le scan devient sans effet : la règle médicale d'une
 * poche découverte pendant le trajet n'est pas définie par le produit
 * (cas H, voir TODO.md), donc on ne l'invente pas.
 */
const STATUTS_SCAN_PERTINENT = new Set<DemandeStatus>([
  "SCANNING_INFRAS",
  "DONORS_NOTIFIED",
  "PRE_RESERVED",
]);

/**
 * Balaie les autres établissements du plus proche au plus lointain, une
 * vérification de stock à la fois, étalées sur la fenêtre de recherche
 * WC-03. Poche compatible trouvée → la demande est résolue sur place ;
 * aucun stock nulle part → bascule vers la mobilisation donneur, quel que
 * soit le niveau d'urgence.
 */
export function lancerScanInfrastructures(demandeId: string): void {
  const demande = store.getDemande(demandeId);
  if (!demande) return;
  const demandeur = store.etablissements.find((e) => e.id === demande.etablissementId);
  if (!demandeur) return;

  const candidats = store.etablissements
    .filter((e) => e.id !== demande.etablissementId)
    .map((e) => {
      const etape: ScanInfraEtape = {
        etablissementId: e.id,
        distanceKm: distanceKm(e.position, demandeur.position),
        statut: "EN_COURS",
      };
      return { etablissement: e, etape };
    })
    .sort((a, b) => a.etape.distanceKm - b.etape.distanceKm);

  demande.scanInfras = candidats.map((c) => c.etape);
  broadcastState();

  if (candidats.length === 0) {
    notifierProchainDonneur(demande.id);
    return;
  }

  const delaiParEtablissement = Math.round(
    policies.dureeRechercheMsParNiveau[demande.niveauUrgence] / candidats.length,
  );

  const verifier = (index: number): void => {
    demoClock.schedule(() => {
      const d = store.getDemande(demandeId);
      if (!d || !STATUTS_SCAN_PERTINENT.has(d.status)) return;

      const { etablissement, etape } = candidats[index]!;
      if ((etablissement.stockPoches[d.groupeSanguin] ?? 0) > 0) {
        resoudreParInfrastructure(d, etablissement, etape);
        return;
      }

      etape.statut = "INDISPONIBLE";
      broadcastState();
      if (index + 1 < candidats.length) {
        verifier(index + 1);
      } else {
        // Aucune poche dans le rayon : bascule donneurs (no-op pour le
        // Niveau Critique dont la recherche parallèle tourne déjà).
        notifierProchainDonneur(demandeId);
      }
    }, delaiParEtablissement);
  };
  verifier(0);
}

/**
 * Une poche compatible résout la demande immédiatement : stock décrémenté,
 * source enregistrée, et les éventuels candidats donneurs encore en course
 * (recherche parallèle) sont éjectés — même mécanique que le Scénario E.
 */
function resoudreParInfrastructure(
  demande: Demande,
  etablissement: Etablissement,
  etape: ScanInfraEtape,
): void {
  etablissement.stockPoches[demande.groupeSanguin] -= 1;
  etape.statut = "POCHE_TROUVEE";
  demande.sourcePocheEtablissementId = etablissement.id;
  for (const mission of store.missionsForDemande(demande.id)) {
    if (mission.status === "NOTIFIED" || mission.status === "PRE_RESERVED") {
      mission.status = "EJECTED";
    }
  }
  changerStatutDemande(demande, "CLOSED");
  broadcastState();
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

  changerStatutDemande(demande, "DONORS_NOTIFIED");
  broadcastState();
}

export function relancerApresRefusOuEjection(demandeId: string): void {
  demoClock.schedule(() => {
    notifierProchainDonneur(demandeId);
  }, DELAI_RELANCE_MS);
}

/**
 * Mutations métier partagées entre les routes HTTP (déclenchées par un vrai
 * humain sur les écrans MD/WH/WC) et la boucle du Mode Autonome
 * (autonomieEngine.ts) — une seule implémentation de chaque règle, jamais
 * dupliquée.
 */

export function accepterMission(
  mission: Mission,
  demande: Demande,
  questionnaire: NonNullable<Mission["questionnaire"]>,
): void {
  mission.status = "PRE_RESERVED";
  mission.questionnaire = questionnaire;
  // donneurAssigneId n'est fixé qu'à la confirmation CNTS, voir confirmerMission.
  changerStatutDemande(demande, "PRE_RESERVED");
}

export function refuserMission(mission: Mission): void {
  mission.status = "REFUSED";
}

export function confirmerMission(demande: Demande, mission: Mission): void {
  mission.status = "EN_ROUTE";
  changerStatutDemande(demande, "EN_ROUTE");
  demande.donneurAssigneId = mission.donneurId;
  for (const autre of store.missionsForDemande(demande.id)) {
    if (autre.id !== mission.id && (autre.status === "NOTIFIED" || autre.status === "PRE_RESERVED")) {
      autre.status = "EJECTED";
    }
  }
}

export function ejecterMission(demande: Demande, mission: Mission): void {
  mission.status = "EJECTED";
  if (demande.donneurAssigneId === mission.donneurId) {
    delete demande.donneurAssigneId;
  }
}

export function annulerMissionEnCours(demande: Demande, mission: Mission): void {
  mission.status = "CANCELLED";
  changerStatutDemande(demande, "DONORS_NOTIFIED");
  delete demande.donneurAssigneId;
}

export function marquerArrivee(demande: Demande): void {
  changerStatutDemande(demande, "ARRIVED");
  const mission = store.missionsForDemande(demande.id).find((m) => m.status === "EN_ROUTE");
  if (mission) mission.status = "ARRIVED";
}

export function marquerDonEffectue(demande: Demande): void {
  changerStatutDemande(demande, "DONATION_COMPLETED");
  const mission = store.missionsForDemande(demande.id).find((m) => m.status === "ARRIVED");
  if (mission) mission.status = "DONATION_COMPLETED";
}

export function envoyerBilan(demande: Demande, mission: Mission, donneur: Donneur): void {
  changerStatutDemande(demande, "CLOSED");
  donneur.nombreDonsEffectues += 1;
  store.resultats.push({
    id: generateId("res"),
    missionId: mission.id,
    donneurId: donneur.id,
    envoyeAt: new Date().toISOString(),
    canalEnvoiSimule: `Bilan envoyé par email chiffré à ${donneur.nom.split(" ")[0]?.toLowerCase()}***@exemple.sn`,
  });
}
