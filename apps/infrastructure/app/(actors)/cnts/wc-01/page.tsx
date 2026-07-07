"use client";

import { useState } from "react";
import { useDredStore } from "@d-red/sync-client";
import { DEMANDE_STATUS_LABELS, NIVEAU_URGENCE_LABELS } from "@d-red/types";
import { formatDateFr } from "@d-red/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ValidationDialog } from "@/components/wc-02-validation-dialog";

/** WC-01 — Dashboard de supervision nationale (toutes les demandes, tous établissements). */
export default function SupervisionPage() {
  const demandes = useDredStore((s) => s.demandes);
  const etablissements = useDredStore((s) => s.etablissements);
  const missions = useDredStore((s) => s.missions);
  const [dialogDemandeId, setDialogDemandeId] = useState<string | null>(null);

  const demandesTriees = [...demandes].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const demandeDialog = demandesTriees.find((d) => d.id === dialogDemandeId);
  const missionDialog = missions.find(
    (m) => m.demandeId === dialogDemandeId && m.status === "PRE_RESERVED",
  );

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Supervision nationale</h1>

      <div className="flex flex-col gap-3">
        {demandesTriees.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune demande active.</p>
        )}
        {demandesTriees.map((demande) => {
          const etablissement = etablissements.find((e) => e.id === demande.etablissementId);
          const missionAValider = missions.find(
            (m) => m.demandeId === demande.id && m.status === "PRE_RESERVED",
          );
          return (
            <Card key={demande.id}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="font-medium">
                    {demande.groupeSanguin} · {etablissement?.nom}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {NIVEAU_URGENCE_LABELS[demande.niveauUrgence]} — {formatDateFr(demande.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{DEMANDE_STATUS_LABELS[demande.status]}</Badge>
                  {missionAValider && (
                    <Button size="sm" onClick={() => setDialogDemandeId(demande.id)}>
                      Traiter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {demandeDialog && missionDialog && (
        <ValidationDialog
          demandeId={demandeDialog.id}
          missionId={missionDialog.id}
          open={Boolean(dialogDemandeId)}
          onOpenChange={(open) => !open && setDialogDemandeId(null)}
        />
      )}
    </main>
  );
}
