import type { ReactNode } from "react";
import { cn } from "../lib/utils.js";

interface PageHeaderProps {
  title: ReactNode;
  /** Sous-titre optionnel (contexte, ville, consigne courte). */
  subtitle?: ReactNode | undefined;
  /** Slot d'action à droite (bouton principal, retour…). */
  action?: ReactNode | undefined;
  className?: string | undefined;
}

/**
 * En-tête de page unique des deux apps : un seul style de titre pour tout le
 * produit, au lieu des variantes ad hoc écran par écran.
 */
export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-x-4 gap-y-2", className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
