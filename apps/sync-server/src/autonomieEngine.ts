import type { Demande, GroupeSanguin, NiveauUrgence, ProduitSanguin } from "@d-red/types";
import { generateId } from "@d-red/utils";
import { store } from "./store.js";
import { autonomie } from "./autonomie.js";
import { broadcastState } from "./realtime.js";
import { demoClock } from "./demoClock.js";
import {
  accepterMission,
  changerStatutDemande,
  confirmerMission,
  demarrerDemande,
  envoyerBilan,
  lancerScanInfrastructures,
  marquerArrivee,
  marquerDonEffectue,
  notifierProchainDonneur,
  refuserMission,
} from "./engine.js";

/**
 * Mode Autonome — le serveur simule lui-même les décisions humaines (MD-07/
 * MD-08, WC-02, WH-05, WC-04) à intervalle régulier, pour que le prototype
 * puisse tourner en boucle sans aucun présentateur ni acteur réel (stand
 * sans surveillance, vitrine autonome). Réutilise exactement les mêmes
 * fonctions métier que les routes HTTP (engine.ts) — pas de logique
 * dupliquée, juste une source différente de décision.
 */

const INTERVALLE_MS = 2500;

// Biaisé vers les groupes ayant un donneur viable dans les données de démo,
// pour que la boucle non surveillée reste majoritairement un "succès" —
// avec tout de même un peu de Scénario F (aucun donneur) pour l'authenticité.
const GROUPES_AVEC_DONNEUR_VIABLE: GroupeSanguin[] = ["O-", "A+", "AB-", "O+"];
const TOUS_LES_GROUPES: GroupeSanguin[] = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
const PRODUITS: ProduitSanguin[] = ["SANG_TOTAL", "PLASMA", "PLAQUETTES", "CONCENTRE_GLOBULAIRE"];
const NIVEAUX: NiveauUrgence[] = ["STANDARD", "PRIORITAIRE", "CRITIQUE"];

function auHasard<T>(tableau: readonly T[]): T {
  return tableau[Math.floor(Math.random() * tableau.length)]!;
}

function creerDemandeAleatoire(): Demande {
  const groupeSanguin =
    Math.random() < 0.85 ? auHasard(GROUPES_AVEC_DONNEUR_VIABLE) : auHasard(TOUS_LES_GROUPES);
  const creeLe = new Date().toISOString();
  return {
    id: generateId("dem"),
    etablissementId: auHasard(store.etablissements).id,
    groupeSanguin,
    produit: auHasard(PRODUITS),
    niveauUrgence: auHasard(NIVEAUX),
    status: "CREATED",
    createdAt: creeLe,
    historiqueStatuts: { CREATED: creeLe },
  };
}

function tick(): void {
  if (!autonomie.actif) return;

  // Fait progresser les demandes figées en CREATED/SCANNING_INFRAS — les
  // demandes seed du jeu de données de démo sont de simples instantanés
  // (jamais passées par demarrerDemande) qui, sans ça, resteraient bloquées
  // pour toujours et empêcheraient la boucle infinie de jamais démarrer.
  for (const demande of store.demandes) {
    if (demande.status === "CREATED") {
      changerStatutDemande(demande, "SCANNING_INFRAS");
    } else if (demande.status === "SCANNING_INFRAS" && !demande.scanInfras) {
      lancerScanInfrastructures(demande.id);
    }
  }

  // Simule MD-07/MD-08 : répond aux donneurs notifiés (80% accepte, 20% refuse).
  for (const mission of store.missions.filter((m) => m.status === "NOTIFIED")) {
    const demande = store.getDemande(mission.demandeId);
    if (!demande) continue;
    if (Math.random() < 0.2) {
      refuserMission(mission);
    } else {
      accepterMission(mission, demande, {
        dateDernierDon: null,
        voyageRecent: false,
        traitementEnCours: false,
        seSentBien: true,
      });
    }
  }

  // Relance la recherche pour les demandes dont plus aucun candidat n'est actif ;
  // si même la relance ne trouve personne — qu'il y ait déjà eu des
  // candidats épuisés ou qu'il n'y en ait jamais eu du tout (Scénario F) —
  // le Mode Autonome abandonne la demande plutôt que de bloquer la boucle
  // pour toujours : un vrai présentateur choisirait simplement d'en lancer
  // une autre plutôt que d'attendre un donneur qui n'existe pas.
  for (const demande of store.demandes) {
    if (demande.status !== "DONORS_NOTIFIED") continue;
    const actifs = store
      .missionsForDemande(demande.id)
      .filter((m) => m.status === "NOTIFIED" || m.status === "PRE_RESERVED");
    if (actifs.length > 0) continue;

    notifierProchainDonneur(demande.id);

    const encoreActifs = store
      .missionsForDemande(demande.id)
      .filter((m) => m.status === "NOTIFIED" || m.status === "PRE_RESERVED");
    if (encoreActifs.length === 0) {
      changerStatutDemande(demande, "CLOSED");
    }
  }

  // Simule WC-02 : confirme le premier candidat ayant accepté.
  for (const demande of store.demandes.filter((d) => d.status === "PRE_RESERVED")) {
    const candidat = store.missionsForDemande(demande.id).find((m) => m.status === "PRE_RESERVED");
    if (candidat) confirmerMission(demande, candidat);
  }

  // Simule WH-05 : scan de réception.
  for (const demande of store.demandes.filter((d) => d.status === "EN_ROUTE")) {
    marquerArrivee(demande);
  }

  // Simule WC-04 : don effectué.
  for (const demande of store.demandes.filter((d) => d.status === "ARRIVED")) {
    marquerDonEffectue(demande);
  }

  // Simule WC-04 : bilan sécurisé envoyé (clôture).
  for (const demande of store.demandes.filter((d) => d.status === "DONATION_COMPLETED")) {
    const mission = store.missionsForDemande(demande.id).find((m) => m.status === "DONATION_COMPLETED");
    const donneur = mission ? store.getDonneur(mission.donneurId) : undefined;
    if (mission && donneur) envoyerBilan(demande, mission, donneur);
  }

  // Enchaîne une nouvelle demande dès qu'aucune n'est active, pour une boucle infinie.
  const demandesActives = store.demandes.filter((d) => d.status !== "CLOSED");
  if (demandesActives.length === 0) {
    const demande = creerDemandeAleatoire();
    store.demandes.push(demande);
    demarrerDemande(demande);
  }

  broadcastState();
}

/** À appeler une fois au démarrage du serveur — la boucle elle-même ne fait rien tant que autonomie.actif est faux. */
export function demarrerBoucleAutonome(): void {
  setInterval(tick, INTERVALLE_MS);
}

export function activerAutonomie(): void {
  autonomie.actif = true;
  // Le Mode Autonome doit tourner même si le présentateur avait laissé le
  // moteur en pause (Mode Démo) — sinon les nouvelles demandes resteraient
  // bloquées à CREATED indéfiniment.
  demoClock.play();
}

export function desactiverAutonomie(): void {
  autonomie.actif = false;
}
