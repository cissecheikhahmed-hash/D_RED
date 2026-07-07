/** Horodatage relatif à l'instant du chargement — les demandes de démo paraissent toujours "récentes". */
export function ilYA(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}
