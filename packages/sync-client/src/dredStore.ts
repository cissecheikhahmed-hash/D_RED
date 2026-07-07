import { create } from "zustand";
import type { Demande, Donneur, Etablissement, Mission, ResultatAnalyse } from "@d-red/types";
import { SYNC_SERVER_URL } from "./config.js";
import { getSocket } from "./socket.js";

interface Snapshot {
  donneurs: Donneur[];
  etablissements: Etablissement[];
  demandes: Demande[];
  missions: Mission[];
  resultats: ResultatAnalyse[];
}

interface DredState extends Snapshot {
  connecte: boolean;
  pret: boolean;
}

/**
 * Store partagé unique ("un seul dredStore") consommé par Donneur et
 * Infrastructure. Il ne fait que refléter l'état du sync-server : chaque
 * mutation métier passe par une requête REST (`@d-red/sync-client/api`) et
 * revient sous forme d'un événement `state:sync` rediffusé à tous les
 * clients — jamais de mutation locale directe de ce store.
 */
export const useDredStore = create<DredState>(() => ({
  donneurs: [],
  etablissements: [],
  demandes: [],
  missions: [],
  resultats: [],
  connecte: false,
  pret: false,
}));

let initialise = false;

/** À appeler une fois par app (ex. dans le layout racine) pour ouvrir la connexion temps réel. */
export function initDredStore(): void {
  if (initialise) return;
  initialise = true;

  const socket = getSocket();

  socket.on("connect", () => useDredStore.setState({ connecte: true }));
  socket.on("disconnect", () => useDredStore.setState({ connecte: false }));
  socket.on("state:sync", (snapshot: Snapshot) => {
    useDredStore.setState({ ...snapshot, pret: true });
  });

  // Filet de sécurité si le socket met du temps à se connecter (ou en environnement sans WebSocket) : hydratation initiale par REST.
  fetch(`${SYNC_SERVER_URL}/state`)
    .then((res) => res.json())
    .then((snapshot: Snapshot) => {
      if (!useDredStore.getState().pret) {
        useDredStore.setState({ ...snapshot, pret: true });
      }
    })
    .catch(() => {
      // Le socket prendra le relais dès qu'il se connectera.
    });
}
