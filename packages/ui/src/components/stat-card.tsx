import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils.js";

type StatTone = "neutral" | "critical" | "waiting" | "success";

/**
 * La sémantique passe par l'icône teintée + le libellé, jamais par la
 * couleur seule ; le chiffre reste en encre de texte (lisibilité d'abord).
 * Seul "critical" colore aussi la valeur : sur un dashboard d'urgence vitale,
 * le compte de demandes critiques doit sauter aux yeux.
 */
const TONE_CLASSES: Record<StatTone, { chip: string; value: string }> = {
  neutral: { chip: "bg-beige text-ink-soft", value: "" },
  critical: { chip: "bg-dred/10 text-dred", value: "text-dred" },
  waiting: { chip: "bg-waiting/15 text-waiting", value: "" },
  success: { chip: "bg-success/10 text-success", value: "" },
};

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: StatTone | undefined;
  /** Précision optionnelle sous le chiffre (ex. "dont 2 vérifiés"). */
  hint?: string | undefined;
  className?: string | undefined;
}

/** Tuile KPI des dashboards (WH-02, WC-01, WA-01). */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
  className,
}: StatCardProps) {
  const classes = TONE_CLASSES[tone];
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2 rounded-xl border border-border bg-card p-4",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-2xl font-semibold leading-none", classes.value)}>{value}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          classes.chip,
        )}
      >
        <Icon className="size-4" />
      </span>
    </div>
  );
}
