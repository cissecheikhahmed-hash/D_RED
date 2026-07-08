import { cn } from "../lib/utils.js";

interface ListSkeletonProps {
  rows?: number | undefined;
  className?: string | undefined;
}

/**
 * Silhouette de liste affichée avant la première synchronisation du store
 * (`pret`) — évite le flash d'état vide pendant la connexion au sync-server.
 */
export function ListSkeleton({ rows = 3, className }: ListSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
        >
          <div className="flex flex-col gap-2">
            <div className="h-4 w-36 animate-pulse rounded bg-beige" />
            <div className="h-3 w-24 animate-pulse rounded bg-beige/70" />
          </div>
          <div className="h-5 w-24 animate-pulse rounded-full bg-beige" />
        </div>
      ))}
    </div>
  );
}
