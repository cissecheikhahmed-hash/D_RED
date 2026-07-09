import { Router } from "express";
import type { Demande, NiveauUrgence, ProduitSanguin, GroupeSanguin } from "@d-red/types";
import { generateId } from "@d-red/utils";
import { store } from "./store.js";
import { demoClock } from "./demoClock.js";
import { broadcastState } from "./realtime.js";
import {
  accepterMission,
  annulerMissionEnCours,
  confirmerMission,
  demarrerDemande,
  ejecterMission,
  envoyerBilan,
  marquerArrivee,
  marquerDonEffectue,
  notifierProchainDonneur,
  refuserMission,
  relancerApresRefusOuEjection,
} from "./engine.js";
import { policies } from "./policies.js";
import { activerAutonomie, desactiverAutonomie } from "./autonomieEngine.js";
import { autonomie } from "./autonomie.js";

export const router: Router = Router();

router.get("/state", (_req, res) => {
  res.json(store.snapshot());
});

// WC-03 — configuration des Decision Policies
router.get("/policies", (_req, res) => {
  res.json(policies);
});

router.post("/policies", (req, res) => {
  const { niveauUrgence, dureeMs } = req.body as { niveauUrgence: NiveauUrgence; dureeMs: number };
  policies.dureeRechercheMsParNiveau[niveauUrgence] = dureeMs;
  res.json(policies);
});

// MD-06 — toggle Disponible/Indisponible sur l'écran de veille
router.post("/donneurs/:donneurId/disponibilite", (req, res) => {
  const donneur = store.getDonneur(req.params.donneurId);
  if (!donneur) {
    res.status(404).json({ error: "Donneur introuvable" });
    return;
  }
  donneur.disponible = Boolean((req.body as { disponible: boolean }).disponible);
  broadcastState();
  res.json(donneur);
});

// WH-03 — "Lancer l'orchestration"
router.post("/demandes", (req, res) => {
  const { etablissementId, groupeSanguin, produit, niveauUrgence } = req.body as {
    etablissementId: string;
    groupeSanguin: GroupeSanguin;
    produit: ProduitSanguin;
    niveauUrgence: NiveauUrgence;
  };

  const etablissement = store.etablissements.find((e) => e.id === etablissementId);
  if (!etablissement) {
    res.status(404).json({ error: "Établissement inconnu" });
    return;
  }

  const creeLe = new Date().toISOString();
  const demande: Demande = {
    id: generateId("dem"),
    etablissementId,
    groupeSanguin,
    produit,
    niveauUrgence,
    status: "CREATED",
    createdAt: creeLe,
    historiqueStatuts: { CREATED: creeLe },
  };
  store.demandes.push(demande);
  demarrerDemande(demande);
  res.status(201).json(demande);
});

// MD-08 — questionnaire soumis juste après "J'ACCEPTE"
router.post("/missions/:missionId/accepter", (req, res) => {
  const mission = store.getMission(req.params.missionId);
  if (!mission || mission.status !== "NOTIFIED") {
    res.status(409).json({ error: "Mission introuvable ou déjà traitée" });
    return;
  }
  const demande = store.getDemande(mission.demandeId);
  if (!demande) {
    res.status(404).json({ error: "Demande introuvable" });
    return;
  }

  accepterMission(mission, demande, req.body?.questionnaire);
  broadcastState();
  res.json(mission);
});

// MD-07 — "Refuser" ou timeout (traités identiquement)
router.post("/missions/:missionId/refuser", (req, res) => {
  const mission = store.getMission(req.params.missionId);
  if (!mission || mission.status !== "NOTIFIED") {
    res.status(409).json({ error: "Mission introuvable ou déjà traitée" });
    return;
  }
  refuserMission(mission);
  broadcastState();
  relancerApresRefusOuEjection(mission.demandeId);
  res.json(mission);
});

// WC-02 — "Confirmer & verrouiller"
router.post("/demandes/:demandeId/confirmer", (req, res) => {
  const demande = store.getDemande(req.params.demandeId);
  const { missionId } = req.body as { missionId: string };
  const mission = store.getMission(missionId);
  if (!demande || !mission || mission.demandeId !== demande.id) {
    res.status(404).json({ error: "Demande ou mission introuvable" });
    return;
  }

  confirmerMission(demande, mission);
  broadcastState();
  res.json(demande);
});

// WC-02 — "Éjecter" (libère le donneur, relance la vague)
router.post("/demandes/:demandeId/ejecter", (req, res) => {
  const demande = store.getDemande(req.params.demandeId);
  const { missionId } = req.body as { missionId: string };
  const mission = store.getMission(missionId);
  if (!demande || !mission || mission.demandeId !== demande.id) {
    res.status(404).json({ error: "Demande ou mission introuvable" });
    return;
  }

  ejecterMission(demande, mission);
  broadcastState();
  relancerApresRefusOuEjection(demande.id);
  res.json(demande);
});

// MD-09/MD-11 — désistement du donneur (avant ou pendant le trajet) : Scénario D, re-recherche immédiate
router.post("/missions/:missionId/annuler", (req, res) => {
  const mission = store.getMission(req.params.missionId);
  if (!mission || (mission.status !== "PRE_RESERVED" && mission.status !== "EN_ROUTE")) {
    res.status(409).json({ error: "Mission introuvable ou pas annulable" });
    return;
  }
  const demande = store.getDemande(mission.demandeId);
  if (!demande) {
    res.status(404).json({ error: "Demande introuvable" });
    return;
  }

  annulerMissionEnCours(demande, mission);
  broadcastState();
  // Re-recherche immédiate (Scénario D) — contrairement au refus/éjection, pas de délai de relance.
  notifierProchainDonneur(demande.id);
  res.json(mission);
});

// WH-05 — scan réception QR (confirmation manuelle, pas de fausse caméra)
router.post("/demandes/:demandeId/arrivee", (req, res) => {
  const demande = store.getDemande(req.params.demandeId);
  if (!demande || demande.status !== "EN_ROUTE") {
    res.status(409).json({ error: "Demande introuvable ou pas en route" });
    return;
  }
  marquerArrivee(demande);
  broadcastState();
  res.json(demande);
});

// Après le don physique
router.post("/demandes/:demandeId/don-effectue", (req, res) => {
  const demande = store.getDemande(req.params.demandeId);
  if (!demande || demande.status !== "ARRIVED") {
    res.status(409).json({ error: "Demande introuvable ou pas arrivée" });
    return;
  }
  marquerDonEffectue(demande);
  broadcastState();
  res.json(demande);
});

// WC-04 — "Envoyer le bilan sécurisé" : clôture + email chiffré simulé + compteur donneur
router.post("/demandes/:demandeId/bilan", (req, res) => {
  const demande = store.getDemande(req.params.demandeId);
  if (!demande || demande.status !== "DONATION_COMPLETED") {
    res.status(409).json({ error: "Demande introuvable ou don pas encore effectué" });
    return;
  }
  const mission = store.missionsForDemande(demande.id).find((m) => m.status === "DONATION_COMPLETED");
  const donneur = mission ? store.getDonneur(mission.donneurId) : undefined;
  if (!mission || !donneur) {
    res.status(404).json({ error: "Mission ou donneur introuvable" });
    return;
  }

  envoyerBilan(demande, mission, donneur);
  broadcastState();
  res.json(demande);
});

// Mode Démo — panneau présentateur, jamais exposé dans les écrans jury
router.get("/demo/status", (_req, res) => {
  res.json({ paused: demoClock.isPaused });
});

router.post("/demo/play", (_req, res) => {
  demoClock.play();
  res.json({ paused: demoClock.isPaused });
});

router.post("/demo/pause", (_req, res) => {
  demoClock.pause();
  res.json({ paused: demoClock.isPaused });
});

router.post("/demo/step", (_req, res) => {
  const advanced = demoClock.step();
  res.json({ advanced, paused: demoClock.isPaused });
});

router.post("/demo/restart", (_req, res) => {
  demoClock.reset();
  store.reset();
  broadcastState();
  res.json({ ok: true });
});

// Mode Autonome — le serveur simule lui-même les décisions humaines en boucle infinie
router.get("/autonomie/status", (_req, res) => {
  res.json({ actif: autonomie.actif });
});

router.post("/autonomie/activer", (_req, res) => {
  activerAutonomie();
  broadcastState();
  res.json({ actif: autonomie.actif });
});

router.post("/autonomie/desactiver", (_req, res) => {
  desactiverAutonomie();
  broadcastState();
  res.json({ actif: autonomie.actif });
});
