import type { Demande, Donneur, GroupeSanguin, Mission, NiveauUrgence, ProduitSanguin } from "@d-red/types";
import { SYNC_SERVER_URL } from "./config.js";

async function poster<T>(chemin: string, body?: unknown): Promise<T> {
  const res = await fetch(`${SYNC_SERVER_URL}${chemin}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const erreur = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(erreur.error ?? `Échec de la requête ${chemin}`);
  }
  return res.json() as Promise<T>;
}

async function obtenir<T>(chemin: string): Promise<T> {
  const res = await fetch(`${SYNC_SERVER_URL}${chemin}`);
  if (!res.ok) throw new Error(`Échec de la requête ${chemin}`);
  return res.json() as Promise<T>;
}

// MD-06 — toggle Disponible/Indisponible sur l'écran de veille
export function definirDisponibilite(donneurId: string, disponible: boolean): Promise<Donneur> {
  return poster<Donneur>(`/donneurs/${donneurId}/disponibilite`, { disponible });
}

// WH-03 — "Lancer l'orchestration"
export function creerDemande(input: {
  etablissementId: string;
  groupeSanguin: GroupeSanguin;
  produit: ProduitSanguin;
  niveauUrgence: NiveauUrgence;
}): Promise<Demande> {
  return poster<Demande>("/demandes", input);
}

// MD-08 — questionnaire soumis juste après "J'ACCEPTE"
export function accepterMission(
  missionId: string,
  questionnaire: NonNullable<Mission["questionnaire"]>,
): Promise<Mission> {
  return poster<Mission>(`/missions/${missionId}/accepter`, { questionnaire });
}

// MD-07 — "Refuser"
export function refuserMission(missionId: string): Promise<Mission> {
  return poster<Mission>(`/missions/${missionId}/refuser`);
}

// WC-02 — "Confirmer & verrouiller"
export function confirmerDemande(demandeId: string, missionId: string): Promise<Demande> {
  return poster<Demande>(`/demandes/${demandeId}/confirmer`, { missionId });
}

// WC-02 — "Éjecter"
export function ejecterMission(demandeId: string, missionId: string): Promise<Demande> {
  return poster<Demande>(`/demandes/${demandeId}/ejecter`, { missionId });
}

// MD-11 — désengagement en route
export function annulerMission(missionId: string): Promise<Mission> {
  return poster<Mission>(`/missions/${missionId}/annuler`);
}

// WH-05 — scan réception QR (confirmation manuelle)
export function marquerArrivee(demandeId: string): Promise<Demande> {
  return poster<Demande>(`/demandes/${demandeId}/arrivee`);
}

export function marquerDonEffectue(demandeId: string): Promise<Demande> {
  return poster<Demande>(`/demandes/${demandeId}/don-effectue`);
}

// WC-04 — "Envoyer le bilan sécurisé"
export function envoyerBilan(demandeId: string): Promise<Demande> {
  return poster<Demande>(`/demandes/${demandeId}/bilan`);
}

// WC-03 — Decision Policies
export interface Policies {
  dureeRechercheMsParNiveau: Record<NiveauUrgence, number>;
}

export function obtenirPolitiques(): Promise<Policies> {
  return obtenir<Policies>("/policies");
}

export function definirDureeRecherche(niveauUrgence: NiveauUrgence, dureeMs: number): Promise<Policies> {
  return poster<Policies>("/policies", { niveauUrgence, dureeMs });
}

// Mode Démo — panneau présentateur uniquement
export const modeDemo = {
  play: () => poster<{ paused: boolean }>("/demo/play"),
  pause: () => poster<{ paused: boolean }>("/demo/pause"),
  step: () => poster<{ advanced: boolean; paused: boolean }>("/demo/step"),
  restart: () => poster<{ ok: boolean }>("/demo/restart"),
};
