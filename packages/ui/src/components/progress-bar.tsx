import { cn } from "../lib/utils.js";

interface ProgressBarProps {
  /** Progression entre 0 et 100. */
  pourcentage: number;
  className?: string | undefined;
}

/** Barre de progression fine aux couleurs de la marque (paliers MD-10). */
export function ProgressBar({ pourcentage, className }: ProgressBarProps) {
  const largeur = Math.min(100, Math.max(0, pourcentage));
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-beige", className)}>
      <div
        className="h-full rounded-full bg-dred transition-[width] duration-500"
        style={{ width: `${largeur}%` }}
      />
    </div>
  );
}
