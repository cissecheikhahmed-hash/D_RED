import type { NiveauUrgence } from "@d-red/types";

export interface Position {
  lat: number;
  lng: number;
}

/**
 * Rayons de vague de mobilisation donneur (km), configurables par les
 * autorités de santé côté WC-03. Valeurs de démo par défaut par niveau
 * d'urgence — plus l'urgence est élevée, plus la première vague est large.
 */
export const RADIUS_WAVES_KM: Record<NiveauUrgence, number[]> = {
  STANDARD: [5, 10, 20],
  PRIORITAIRE: [5, 10, 20],
  CRITIQUE: [10, 20, 30],
};

/** Distance à vol d'oiseau (km) entre deux positions simulées — formule de Haversine. */
export function distanceKm(a: Position, b: Position): number {
  const R = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** ETA simulé (minutes) à partir d'une distance, à une vitesse urbaine moyenne fictive. */
export function simulateEtaMinutes(distance: number, vitesseKmh = 28): number {
  return Math.max(1, Math.round((distance / vitesseKmh) * 60));
}
