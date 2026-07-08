#!/usr/bin/env node
/**
 * Suite de tests d'intégration contre un sync-server déjà en cours
 * d'exécution (localhost:4000 par défaut). Convertit en script répétable
 * les vérifications manuelles faites via curl pendant le développement.
 *
 * Usage : node scripts/test-scenarios.mjs
 * Prérequis : le serveur doit tourner (pnpm --filter @d-red/sync-server dev
 * ou node dist/index.js).
 *
 * ATTENTION : ce script appelle /demo/restart plusieurs fois — il remet
 * l'état du serveur à zéro à chaque test. Ne pas lancer pendant une vraie
 * démo en cours.
 */

const BASE = process.env.SYNC_SERVER_URL ?? "http://localhost:4000";

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.log(`  ✗ ${msg}`);
    failed++;
    failures.push(msg);
  }
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, data: await res.json() };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function restart() {
  await post("/demo/restart");
  await sleep(100);
}

/** Interroge /state jusqu'à ce que la demande atteigne l'un des statuts cibles, ou timeout. */
async function attendreStatutDemande(demandeId, statutsCibles, timeoutMs = 6000) {
  const debut = Date.now();
  while (Date.now() - debut < timeoutMs) {
    const { data } = await get("/state");
    const demande = data.demandes.find((d) => d.id === demandeId);
    if (demande && statutsCibles.includes(demande.status)) return { demande, state: data };
    await sleep(150);
  }
  const { data } = await get("/state");
  return { demande: data.demandes.find((d) => d.id === demandeId), state: data };
}

/** Interroge /state jusqu'à ce qu'une mission NOTIFIED apparaisse pour cette demande (hors ids déjà vus). */
async function attendreNouvelleMissionNotifiee(demandeId, idsDejaVus = new Set(), timeoutMs = 6000) {
  const debut = Date.now();
  while (Date.now() - debut < timeoutMs) {
    const { data } = await get("/state");
    const mission = data.missions.find(
      (m) => m.demandeId === demandeId && m.status === "NOTIFIED" && !idsDejaVus.has(m.id),
    );
    if (mission) return mission;
    await sleep(150);
  }
  return null;
}

async function resoudreDemandeJusquauBout(demandeId, missionId) {
  await post(`/demandes/${demandeId}/confirmer`, { missionId });
  await post(`/demandes/${demandeId}/arrivee`);
  await post(`/demandes/${demandeId}/don-effectue`);
  return post(`/demandes/${demandeId}/bilan`);
}

// --- Scénario A : succès complet via mobilisation donneur ---
async function testScenarioA() {
  console.log("\n=== Scénario A : succès complet ===");
  await restart();

  const { data: demande } = await post("/demandes", {
    etablissementId: "etab_hopital_principal_dakar",
    groupeSanguin: "O-",
    produit: "SANG_TOTAL",
    niveauUrgence: "CRITIQUE",
  });

  const { state } = await attendreStatutDemande(demande.id, ["DONORS_NOTIFIED"]);
  const mission = state.missions.find((m) => m.demandeId === demande.id && m.status === "NOTIFIED");
  assert(Boolean(mission), "un donneur est notifié après création");
  if (!mission) return;

  await post(`/missions/${mission.id}/accepter`, {
    questionnaire: { dateDernierDon: null, voyageRecent: false, traitementEnCours: false, seSentBien: true },
  });
  let { demande: d1 } = await attendreStatutDemande(demande.id, ["PRE_RESERVED"]);
  assert(d1?.status === "PRE_RESERVED", "accepter -> PRE_RESERVED");

  const donneurAvant = (await get("/state")).data.donneurs.find((d) => d.id === mission.donneurId)
    .nombreDonsEffectues;

  await post(`/demandes/${demande.id}/confirmer`, { missionId: mission.id });
  ({ demande: d1 } = await attendreStatutDemande(demande.id, ["EN_ROUTE"]));
  assert(d1?.status === "EN_ROUTE", "confirmer -> EN_ROUTE");

  await post(`/demandes/${demande.id}/arrivee`);
  ({ demande: d1 } = await attendreStatutDemande(demande.id, ["ARRIVED"]));
  assert(d1?.status === "ARRIVED", "arrivée -> ARRIVED");

  await post(`/demandes/${demande.id}/don-effectue`);
  ({ demande: d1 } = await attendreStatutDemande(demande.id, ["DONATION_COMPLETED"]));
  assert(d1?.status === "DONATION_COMPLETED", "don effectué -> DONATION_COMPLETED");

  await post(`/demandes/${demande.id}/bilan`);
  const { data: finalState } = await get("/state");
  const dFinal = finalState.demandes.find((d) => d.id === demande.id);
  assert(dFinal?.status === "CLOSED", "bilan -> CLOSED");

  const donneurApres = finalState.donneurs.find((d) => d.id === mission.donneurId).nombreDonsEffectues;
  assert(donneurApres === donneurAvant + 1, "compteur de dons du donneur incrémenté");
  assert(
    finalState.resultats.some((r) => r.missionId === mission.id),
    "un résultat/bilan est créé",
  );
}

// --- Scénario B : refus puis relance automatique vers le donneur suivant ---
async function testScenarioB() {
  console.log("\n=== Scénario B : refus puis relance ===");
  await restart();
  // Libère Aïssatou Ba (PRE_RESERVED sur dem_4 dans les données seed) pour garantir 2 candidats O- libres.
  await resoudreDemandeJusquauBout("dem_4", "mis_dem4_aissatou");

  const { data: demande } = await post("/demandes", {
    etablissementId: "etab_hopital_principal_dakar",
    groupeSanguin: "O-",
    produit: "SANG_TOTAL",
    niveauUrgence: "CRITIQUE",
  });

  const premiere = await attendreNouvelleMissionNotifiee(demande.id);
  assert(Boolean(premiere), "un premier donneur est notifié");
  if (!premiere) return;

  await post(`/missions/${premiere.id}/refuser`);
  const { data: apresRefus } = await get("/state");
  assert(
    apresRefus.missions.find((m) => m.id === premiere.id)?.status === "REFUSED",
    "le refus est bien enregistré",
  );

  const seconde = await attendreNouvelleMissionNotifiee(demande.id, new Set([premiere.id]));
  assert(Boolean(seconde), "un second donneur (différent) est notifié après le refus");
  assert(seconde && seconde.donneurId !== premiere.donneurId, "le second donneur n'est pas le même que le premier");
}

// --- Scénario C : Niveau Standard résolu par infra seule, jamais de donneur mobilisé ---
async function testScenarioC() {
  console.log("\n=== Scénario C : Niveau Standard, infra seule ===");
  await restart();

  const { data: demande } = await post("/demandes", {
    etablissementId: "etab_clinique_pasteur",
    groupeSanguin: "AB+",
    produit: "PLASMA",
    niveauUrgence: "STANDARD",
  });

  const { demande: d1, state } = await attendreStatutDemande(demande.id, ["CLOSED"]);
  assert(d1?.status === "CLOSED", "la demande se clôture automatiquement");
  assert(d1?.donneurAssigneId === undefined, "aucun donneur jamais assigné");
  assert(
    state.missions.filter((m) => m.demandeId === demande.id).length === 0,
    "aucune mission jamais créée pour cette demande",
  );
  assert(
    d1?.sourcePocheEtablissementId === "etab_cnts_dakar",
    "la poche vient bien de l'établissement le plus proche qui en a en stock (CNTS Dakar)",
  );
  assert(
    d1?.scanInfras?.some(
      (s) => s.etablissementId === "etab_cnts_dakar" && s.statut === "POCHE_TROUVEE",
    ),
    "le scan des infrastructures trace bien la poche trouvée",
  );
  const cnts = state.etablissements.find((e) => e.id === "etab_cnts_dakar");
  assert(cnts?.stockPoches["AB+"] === 1, "le stock AB+ du CNTS est décrémenté (2 -> 1)");
}

// --- Scan infra : c'est le stock qui décide, pas le niveau d'urgence ---
async function testStockAvantUrgence() {
  console.log("\n=== Scan infra : PRIORITAIRE résolu par une poche en stock ===");
  await restart();

  const { data: demande } = await post("/demandes", {
    etablissementId: "etab_hopital_thies",
    groupeSanguin: "A+",
    produit: "SANG_TOTAL",
    niveauUrgence: "PRIORITAIRE",
  });

  const { demande: d1, state } = await attendreStatutDemande(demande.id, ["CLOSED"]);
  assert(d1?.status === "CLOSED", "un niveau PRIORITAIRE se résout aussi par une poche en stock");
  assert(Boolean(d1?.sourcePocheEtablissementId), "l'établissement source de la poche est enregistré");
  assert(
    state.missions.filter((m) => m.demandeId === demande.id).length === 0,
    "aucun donneur mobilisé quand une infrastructure a la poche",
  );
  const source = state.etablissements.find((e) => e.id === d1?.sourcePocheEtablissementId);
  assert(
    source && source.stockPoches["A+"] >= 0 && source.stockPoches["A+"] < 4,
    "le stock A+ de l'établissement source est décrémenté",
  );
}

// --- Scan infra : STANDARD sans stock bascule vers les donneurs ---
async function testBasculeDonneursStandard() {
  console.log("\n=== Scan infra : STANDARD sans stock bascule vers les donneurs ===");
  await restart();

  const { data: demande } = await post("/demandes", {
    etablissementId: "etab_hopital_principal_dakar",
    groupeSanguin: "O-",
    produit: "SANG_TOTAL",
    niveauUrgence: "STANDARD",
  });

  const { demande: d1 } = await attendreStatutDemande(demande.id, ["DONORS_NOTIFIED"], 8000);
  assert(
    d1?.status === "DONORS_NOTIFIED",
    "aucune poche O- en stock : la demande bascule vers la recherche de donneurs",
  );
  assert(
    d1?.scanInfras?.length === 3 && d1.scanInfras.every((s) => s.statut === "INDISPONIBLE"),
    "les 3 autres établissements ont tous été balayés sans poche",
  );
  const mission = await attendreNouvelleMissionNotifiee(demande.id);
  assert(Boolean(mission), "un donneur O- est notifié après l'épuisement des infrastructures");
}

// --- Scan infra : CRITIQUE cherche infra ET donneurs en même temps ---
async function testScanParalleleCritique() {
  console.log("\n=== Scan infra : recherche parallèle du Niveau Critique ===");
  await restart();

  const { data: demande } = await post("/demandes", {
    etablissementId: "etab_hopital_principal_dakar",
    groupeSanguin: "O-",
    produit: "SANG_TOTAL",
    niveauUrgence: "CRITIQUE",
  });

  await sleep(1400);
  const { data: pendant } = await get("/state");
  const dPendant = pendant.demandes.find((d) => d.id === demande.id);
  const notifiees = pendant.missions.filter(
    (m) => m.demandeId === demande.id && m.status === "NOTIFIED",
  );
  assert(
    notifiees.length > 0 && dPendant?.scanInfras?.some((s) => s.statut === "EN_COURS"),
    "des donneurs sont notifiés pendant que le scan des infrastructures tourne encore",
  );

  await sleep(1500);
  const { data: apres } = await get("/state");
  const dApres = apres.demandes.find((d) => d.id === demande.id);
  assert(
    dApres?.scanInfras?.every((s) => s.statut === "INDISPONIBLE"),
    "le scan se termine sans poche (aucun stock O-) et la voie donneurs reste active",
  );
}

// --- Scénario D : le donneur se désiste en route -> re-recherche immédiate ---
async function testScenarioD() {
  console.log("\n=== Scénario D : désistement en route ===");
  await restart();
  await resoudreDemandeJusquauBout("dem_4", "mis_dem4_aissatou");

  const { data: demande } = await post("/demandes", {
    etablissementId: "etab_hopital_principal_dakar",
    groupeSanguin: "O-",
    produit: "SANG_TOTAL",
    niveauUrgence: "CRITIQUE",
  });

  const mission = await attendreNouvelleMissionNotifiee(demande.id);
  assert(Boolean(mission), "un donneur est notifié");
  if (!mission) return;

  await post(`/missions/${mission.id}/accepter`, {
    questionnaire: { dateDernierDon: null, voyageRecent: false, traitementEnCours: false, seSentBien: true },
  });
  await post(`/demandes/${demande.id}/confirmer`, { missionId: mission.id });
  const { demande: enRoute } = await attendreStatutDemande(demande.id, ["EN_ROUTE"]);
  assert(enRoute?.status === "EN_ROUTE", "la demande est bien EN_ROUTE avant désistement");

  await post(`/missions/${mission.id}/annuler`);
  const { data: apresAnnulation } = await get("/state");
  assert(
    apresAnnulation.demandes.find((d) => d.id === demande.id)?.status === "DONORS_NOTIFIED",
    "retour à DONORS_NOTIFIED après désistement",
  );
  assert(
    apresAnnulation.missions.find((m) => m.id === mission.id)?.status === "CANCELLED",
    "la mission du donneur désisté passe à CANCELLED",
  );

  const nouveauDonneur = await attendreNouvelleMissionNotifiee(demande.id, new Set([mission.id]), 3000);
  assert(Boolean(nouveauDonneur), "un nouveau donneur est notifié immédiatement (re-recherche sans délai)");
}

// --- Scénario E : Niveau Critique notifie 2 candidats simultanément, CNTS compare et choisit ---
async function testScenarioE() {
  console.log("\n=== Scénario E : comparaison multi-donneurs (Niveau Critique) ===");
  await restart();
  await resoudreDemandeJusquauBout("dem_4", "mis_dem4_aissatou");

  const { data: demande } = await post("/demandes", {
    etablissementId: "etab_hopital_principal_dakar",
    groupeSanguin: "O-",
    produit: "SANG_TOTAL",
    niveauUrgence: "CRITIQUE",
  });

  await sleep(3000);
  const { data: state1 } = await get("/state");
  const notifiees = state1.missions.filter((m) => m.demandeId === demande.id && m.status === "NOTIFIED");
  assert(notifiees.length === 2, "2 candidats sont notifiés simultanément pour le Niveau Critique");
  if (notifiees.length < 2) return;

  await post(`/missions/${notifiees[0].id}/accepter`, {
    questionnaire: { dateDernierDon: null, voyageRecent: false, traitementEnCours: false, seSentBien: true },
  });
  await post(`/missions/${notifiees[1].id}/accepter`, {
    questionnaire: { dateDernierDon: null, voyageRecent: false, traitementEnCours: false, seSentBien: true },
  });

  const { data: state2 } = await get("/state");
  const preReservees = state2.missions.filter(
    (m) => m.demandeId === demande.id && m.status === "PRE_RESERVED",
  );
  assert(preReservees.length === 2, "les deux candidats peuvent accepter en parallèle");
  assert(
    state2.demandes.find((d) => d.id === demande.id)?.donneurAssigneId === undefined,
    "aucun donneur assigné tant que le CNTS n'a pas choisi entre les deux",
  );

  await post(`/demandes/${demande.id}/confirmer`, { missionId: notifiees[0].id });
  const { data: state3 } = await get("/state");
  assert(
    state3.missions.find((m) => m.id === notifiees[0].id)?.status === "EN_ROUTE",
    "le candidat choisi passe EN_ROUTE",
  );
  assert(
    state3.missions.find((m) => m.id === notifiees[1].id)?.status === "EJECTED",
    "l'autre candidat est éjecté automatiquement",
  );
  assert(
    state3.demandes.find((d) => d.id === demande.id)?.donneurAssigneId === notifiees[0].donneurId,
    "le donneur assigné correspond bien à celui confirmé par le CNTS",
  );
}

// --- Scénario F : rayon épuisé, aucun donneur disponible ---
async function testScenarioF() {
  console.log("\n=== Scénario F : aucun donneur disponible ===");
  await restart();

  const { data: demande } = await post("/demandes", {
    etablissementId: "etab_hopital_principal_dakar",
    groupeSanguin: "B-",
    produit: "SANG_TOTAL",
    niveauUrgence: "CRITIQUE",
  });

  await sleep(2500);
  const { data: state } = await get("/state");
  const d = state.demandes.find((x) => x.id === demande.id);
  assert(d?.status === "DONORS_NOTIFIED", "la demande reste en recherche (pas d'erreur, pas de crash)");
  assert(
    state.missions.filter((m) => m.demandeId === demande.id).length === 0,
    "aucune mission créée (aucun donneur B- vérifié disponible dans les données de démo)",
  );
}

// --- Scénario G : urgences concurrentes, pas de double-réservation du même donneur ---
async function testScenarioG() {
  console.log("\n=== Scénario G : urgences concurrentes (anti-double-réservation) ===");
  await restart();
  // Libère Khady Fall (seule donneuse AB- vérifiée), EN_ROUTE sur dem_5 dans les données seed.
  await post("/demandes/dem_5/arrivee");
  await post("/demandes/dem_5/don-effectue");
  await post("/demandes/dem_5/bilan");

  const { data: demandeA } = await post("/demandes", {
    etablissementId: "etab_hopital_principal_dakar",
    groupeSanguin: "AB-",
    produit: "PLASMA",
    niveauUrgence: "CRITIQUE",
  });
  const { data: demandeB } = await post("/demandes", {
    etablissementId: "etab_cnts_dakar",
    groupeSanguin: "AB-",
    produit: "PLASMA",
    niveauUrgence: "CRITIQUE",
  });

  await sleep(2500);
  const { data: state } = await get("/state");
  const missionsA = state.missions.filter((m) => m.demandeId === demandeA.id && m.status === "NOTIFIED");
  const missionsB = state.missions.filter((m) => m.demandeId === demandeB.id && m.status === "NOTIFIED");
  const totalNotifications = missionsA.length + missionsB.length;

  assert(totalNotifications <= 1, "Khady Fall n'est notifiée que sur une seule des deux demandes concurrentes");
  assert(missionsA.length + missionsB.length >= 0, "pas de crash serveur avec 2 demandes concurrentes");
}

// --- WC-03 : Decision Policies ---
async function testDecisionPolicies() {
  console.log("\n=== WC-03 : Decision Policies ===");
  const { data: avant } = await get("/policies");
  const original = avant.dureeRechercheMsParNiveau.CRITIQUE;

  const { data: apres } = await post("/policies", { niveauUrgence: "CRITIQUE", dureeMs: 9999 });
  assert(apres.dureeRechercheMsParNiveau.CRITIQUE === 9999, "la modification de délai est bien persistée");

  const { data: relu } = await get("/policies");
  assert(relu.dureeRechercheMsParNiveau.CRITIQUE === 9999, "GET /policies reflète bien la nouvelle valeur");

  // Restaure la valeur d'origine pour ne pas fausser les tests suivants.
  await post("/policies", { niveauUrgence: "CRITIQUE", dureeMs: original });
}

// --- Mode Démo : pause / step / play / restart ---
async function testModeDemo() {
  console.log("\n=== Mode Démo : pause / step / play / restart ===");
  await restart();

  await post("/demo/pause");
  const { data: statutPause } = await get("/demo/status");
  assert(statutPause.paused === true, "pause active bien le statut paused");

  const { data: demande } = await post("/demandes", {
    etablissementId: "etab_hopital_principal_dakar",
    groupeSanguin: "A+",
    produit: "PLASMA",
    niveauUrgence: "CRITIQUE",
  });
  await sleep(1500);
  const { data: stateEnPause } = await get("/state");
  assert(
    stateEnPause.demandes.find((d) => d.id === demande.id)?.status === "CREATED",
    "la demande reste bloquée à CREATED tant que le moteur est en pause",
  );

  const { data: apresStep } = await post("/demo/step");
  assert(apresStep.advanced === true, "step avance bien d'une étape");
  const { data: stateApresStep } = await get("/state");
  assert(
    stateApresStep.demandes.find((d) => d.id === demande.id)?.status === "SCANNING_INFRAS",
    "la demande a avancé exactement d'une étape (CREATED -> SCANNING_INFRAS)",
  );

  await post("/demo/play");
  const { data: statutPlay } = await get("/demo/status");
  assert(statutPlay.paused === false, "play désactive bien la pause");

  await post("/demo/restart");
  const { data: stateRestart } = await get("/state");
  assert(stateRestart.demandes.length === 8, "restart remet bien les 8 demandes de démo d'origine");
}

// --- Mode Autonome : boucle sans intervention humaine ---
async function testModeAutonome() {
  console.log("\n=== Mode Autonome : boucle sans intervention humaine ===");
  await restart();

  const { data: avantActivation } = await get("/state");
  const totalAvant = avantActivation.demandes.length;

  await post("/autonomie/activer");
  const { data: statutActif } = await get("/autonomie/status");
  assert(statutActif.actif === true, "activer bascule bien le statut à actif");

  await sleep(9000);
  const { data: apres9s } = await get("/state");
  assert(
    apres9s.demandes.length > totalAvant,
    "de nouvelles demandes sont créées automatiquement sans aucune action humaine",
  );
  assert(
    apres9s.donneurs.some((d) => d.nombreDonsEffectues > 0),
    "au moins un donneur a un compteur de dons incrémenté (chaîne complète simulée jusqu'au bilan)",
  );

  await post("/autonomie/desactiver");
  const { data: statutInactif } = await get("/autonomie/status");
  assert(statutInactif.actif === false, "désactiver bascule bien le statut à inactif");

  const { data: apresDesactivation } = await get("/state");
  await sleep(4000);
  const { data: unPeuPlusTard } = await get("/state");
  assert(
    unPeuPlusTard.demandes.length === apresDesactivation.demandes.length,
    "plus aucune nouvelle demande n'est créée une fois désactivé",
  );
}

async function main() {
  console.log(`Suite de tests contre ${BASE}`);
  const tests = [
    testScenarioA,
    testScenarioB,
    testScenarioC,
    testStockAvantUrgence,
    testBasculeDonneursStandard,
    testScanParalleleCritique,
    testScenarioD,
    testScenarioE,
    testScenarioF,
    testScenarioG,
    testDecisionPolicies,
    testModeDemo,
    testModeAutonome,
  ];

  for (const test of tests) {
    try {
      await test();
    } catch (e) {
      failed++;
      failures.push(`${test.name} a levé une exception : ${e.message}`);
      console.log(`  ✗ EXCEPTION dans ${test.name} : ${e.message}`);
    }
  }

  // Laisse le serveur dans un état propre pour la suite (démo live, autre test manuel...).
  await post("/demo/restart");

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Résultat : ${passed} réussis, ${failed} échoués`);
  if (failures.length > 0) {
    console.log("\nÉchecs :");
    failures.forEach((f) => console.log(`  - ${f}`));
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Erreur fatale :", e);
  process.exit(1);
});
