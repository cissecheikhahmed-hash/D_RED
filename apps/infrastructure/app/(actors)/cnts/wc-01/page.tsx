"use client";

import { useState } from "react";
import { useDredStore } from "@d-red/sync-client";
import { DEMANDE_STATUS_LABELS, NIVEAU_URGENCE_LABELS } from "@d-red/types";
import { formatDateFr } from "@d-red/utils";
import { EmptyState } from "@d-red/ui/components/empty-state";
import { ShieldCheck } from "lucide-react";
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
  const missionsDialog = missions.filter(
    (m) => m.demandeId === dialogDemandeId && (m.status === "NOTIFIED" || m.status === "PRE_RESERVED"),
  );

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Supervision nationale</h1>

      <div className="flex flex-col gap-3">
        {demandesTriees.length === 0 && (
          <EmptyState icon={ShieldCheck} message="Aucune demande active sur le réseau national." />
        )}
        {demandesTriees.map((demande) => {
          const etablissement = etablissements.find((e) => e.id === demande.etablissementId);
          const candidats = missions.filter(
            (m) => m.demandeId === demande.id && (m.status === "NOTIFIED" || m.status === "PRE_RESERVED"),
          );
          const aTraiter = candidats.some((m) => m.status === "PRE_RESERVED");
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
                  {candidats.length > 1 && <Badge variant="outline">{candidats.length} candidats</Badge>}
                  <Badge variant="secondary">{DEMANDE_STATUS_LABELS[demande.status]}</Badge>
                  {aTraiter && (
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

      {dialogDemandeId && missionsDialog.length > 0 && (
        <ValidationDialog
          demandeId={dialogDemandeId}
          missions={missionsDialog}
          open={Boolean(dialogDemandeId)}
          onOpenChange={(open) => !open && setDialogDemandeId(null)}
        />
      )}
    </main>
  );
}
