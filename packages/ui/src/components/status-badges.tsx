import {
  DEMANDE_STATUS_LABELS,
  MISSION_STATUS_LABELS,
  NIVEAU_URGENCE_LABELS,
  type DemandeStatus,
  type MissionStatus,
  type NiveauUrgence,
} from "@d-red/types";
import { cn } from "../lib/utils.js";

/**
 * Tons sémantiques dérivés de la palette D.RED (tokens.css) :
 * attente = orange, succès = vert, critique = rouge plein, neutre = beige.
 * Le libellé reste dans une couleur lisible ; c'est le point coloré qui
 * porte la sémantique (pattern Linear), sauf pour "critical" qui doit
 * ressortir immédiatement.
 */
type Tone = "neutral" | "waiting" | "success" | "critical";

const TONE_CLASSES: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: "border-ink/10 bg-beige/60 text-ink-soft", dot: "bg-ink/30" },
  waiting: { badge: "border-waiting/30 bg-waiting/10 text-ink", dot: "bg-waiting" },
  success: { badge: "border-success/25 bg-success/10 text-success", dot: "bg-success" },
  critical: { badge: "border-dred bg-dred text-white", dot: "bg-white" },
};

interface DotBadgeProps {
  tone: Tone;
  /** Anime le point pour signaler qu'une action est en cours côté moteur. */
  pulse?: boolean | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}

/** Badge générique à point coloré — brique de base des badges de statut D.RED. */
export function DotBadge({ tone, pulse, children, className }: DotBadgeProps) {
  const classes = TONE_CLASSES[tone];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        classes.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", classes.dot, pulse && "animate-pulse")} />
      {children}
    </span>
  );
}

const NIVEAU_URGENCE_TONES: Record<NiveauUrgence, { tone: Tone; pulse?: boolean }> = {
  STANDARD: { tone: "neutral" },
  PRIORITAIRE: { tone: "waiting" },
  CRITIQUE: { tone: "critical", pulse: true },
};

/** Niveau d'urgence d'une demande — Critique en rouge plein pulsé, impossible à rater. */
export function UrgencyBadge({ niveau, className }: { niveau: NiveauUrgence; className?: string }) {
  const { tone, pulse } = NIVEAU_URGENCE_TONES[niveau];
  return (
    <DotBadge tone={tone} pulse={pulse} className={className}>
      {NIVEAU_URGENCE_LABELS[niveau]}
    </DotBadge>
  );
}

/** Statuts pendant lesquels le Decision Engine travaille activement (point pulsé). */
const DEMANDE_STATUS_TONES: Record<DemandeStatus, { tone: Tone; pulse?: boolean }> = {
  CREATED: { tone: "waiting", pulse: true },
  SCANNING_INFRAS: { tone: "waiting", pulse: true },
  DONORS_NOTIFIED: { tone: "waiting", pulse: true },
  PRE_RESERVED: { tone: "waiting" },
  EN_ROUTE: { tone: "waiting" },
  ARRIVED: { tone: "waiting" },
  DONATION_COMPLETED: { tone: "success" },
  CLOSED: { tone: "success" },
};

/** Statut d'une demande, codé couleur : orange en cours, vert résolu. */
export function DemandeStatusBadge({
  status,
  className,
}: {
  status: DemandeStatus;
  className?: string;
}) {
  const { tone, pulse } = DEMANDE_STATUS_TONES[status];
  return (
    <DotBadge tone={tone} pulse={pulse} className={className}>
      {DEMANDE_STATUS_LABELS[status]}
    </DotBadge>
  );
}

const MISSION_STATUS_TONES: Record<MissionStatus, { tone: Tone; pulse?: boolean }> = {
  NOTIFIED: { tone: "waiting", pulse: true },
  PRE_RESERVED: { tone: "waiting" },
  EN_ROUTE: { tone: "waiting" },
  ARRIVED: { tone: "waiting" },
  DONATION_COMPLETED: { tone: "success" },
  REFUSED: { tone: "neutral" },
  EJECTED: { tone: "neutral" },
  CANCELLED: { tone: "neutral" },
};

/** Statut d'une mission donneur — les issues sans don (refus, annulation…) restent neutres. */
export function MissionStatusBadge({
  status,
  className,
}: {
  status: MissionStatus;
  className?: string;
}) {
  const { tone, pulse } = MISSION_STATUS_TONES[status];
  return (
    <DotBadge tone={tone} pulse={pulse} className={className}>
      {MISSION_STATUS_LABELS[status]}
    </DotBadge>
  );
}
