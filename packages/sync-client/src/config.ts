/** URL du sync-server — seule source de vérité partagée entre Donneur/Hôpital/CNTS. */
export const SYNC_SERVER_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SYNC_SERVER_URL) ||
  "http://localhost:4000";
