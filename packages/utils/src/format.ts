export function formatDateFr(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Libellé relatif simple ("à l'instant", "il y a 3 min") pour les timelines
 * temps réel. Au-delà de 24 h, la date absolue redevient plus parlante.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin <= 0) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  return formatDateFr(iso);
}

/** Heure locale courte (HH:MM) — horodatage des étapes de timeline. */
export function formatHeureFr(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatEtaMinutes(minutes: number): string {
  return `${minutes} min`;
}

/** Distance courte en français ("2,1 km") — affichage du scan des infrastructures. */
export function formatDistanceKm(km: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(km)} km`;
}
