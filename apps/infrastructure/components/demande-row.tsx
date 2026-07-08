"use client";

import type { GroupeSanguin } from "@d-red/types";
import { GroupeSanguinTag } from "@d-red/ui/components/groupe-sanguin-tag";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DemandeRowProps {
  groupe: GroupeSanguin;
  /** Badges affichés à côté du groupe (urgence…). */
  badges?: React.ReactNode;
  /** Ligne secondaire sous le groupe (établissement, horodatage…). */
  meta?: React.ReactNode;
  /** Contenu de droite (badge de statut, boutons d'action…). */
  end?: React.ReactNode;
  /** Rend la carte cliquable (navigation vers le détail). */
  onClick?: (() => void) | undefined;
}

/**
 * Ligne de liste « demande » commune à WH-02 / WC-01 / WH-05 / WC-04 :
 * même anatomie partout (groupe sanguin Anton + badges, méta, actions à
 * droite) au lieu de quatre variantes écrites à la main.
 */
export function DemandeRow({ groupe, badges, meta, end, onClick }: DemandeRowProps) {
  return (
    <Card
      className={cn(
        onClick && "cursor-pointer transition-all hover:-translate-y-px hover:shadow-sm",
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <GroupeSanguinTag groupe={groupe} />
            {badges}
          </div>
          {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
        </div>
        {end && <div className="flex flex-wrap items-center justify-end gap-2">{end}</div>}
      </CardContent>
    </Card>
  );
}
