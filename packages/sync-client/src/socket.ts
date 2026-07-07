import { io, type Socket } from "socket.io-client";
import { SYNC_SERVER_URL } from "./config.js";

let socket: Socket | undefined;

/** Instance unique de connexion Socket.IO, partagée par tout composant consommant `dredStore`. */
export function getSocket(): Socket {
  socket ??= io(SYNC_SERVER_URL, { autoConnect: true });
  return socket;
}
