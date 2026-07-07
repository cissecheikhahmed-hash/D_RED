import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils.js";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  className?: string;
}

/** État vide générique des listes/dashboards (WH-02, WC-01, WC-04, MD-14…). */
export function EmptyState({ icon: Icon, message, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-8 opacity-40" />
      <p>{message}</p>
    </div>
  );
}
