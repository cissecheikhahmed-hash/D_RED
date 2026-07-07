import type { Server } from "socket.io";
import { store } from "./store.js";

let io: Server | undefined;

export function attachIo(server: Server): void {
  io = server;
}

/** Rediffuse l'état complet — utilisé à la connexion d'un client et après un "restart" Mode Démo. */
export function broadcastState(): void {
  io?.emit("state:sync", store.snapshot());
}
