"use client";

import { useState } from "react";
import { useDredStore } from "@d-red/sync-client";
import { formatRelativeTime } from "@d-red/utils";
import { EmptyState } from "@d-red/ui/components/empty-state";
import { StatCard } from "@d-red/ui/components/stat-card";
import { DemandeStatusBadge, UrgencyBadge } from "@d-red/ui/components/status-badges";
import { useNow } from "@d-red/ui/hooks/use-now";
import { Activity, HeartHandshake, ShieldCheck, Siren, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ValidationDialog } from "@/components/wc-02-validation-dialog";

/** WC-01 — Dashboard de supervision nationale (toutes les demandes, tous établissements). */
export default function SupervisionPage() {
  const demandes = useDredStore((s) => s.demandes);
  const etablissements = useDredStore((s) => s.etablissements);
  const missions = useDredStore((s) => s.missions);
  const donneurs = useDredStore((s) => s.donneurs);
  const [dialogDemandeId, setDialogDemandeId] = useState<string | null>(null);

  const demandesTriees = [...demandes].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const missionsDialog = missions.filter(
    (m) => m.demandeId === dialogDemandeId && (m.status === "NOTIFIED" || m.status === "PRE_RESERVED"),
  );

  const demandesActives = demandes.filter((d) => d.status !== "CLOSED");
  const critiquesActives = demandesActives.filter((d) => d.niveauUrgence === "CRITIQUE").length;
  const donneursMobilises = missions.filter(
    (m) =>
      m.status === "NOTIFIED" ||
      m.status === "PRE_RESERVED" ||
      m.status === "EN_ROUTE" ||
      m.status === "ARRIVED",
  ).length;
  const donneursDisponibles = donneurs.filter((d) => d.disponible).length;
  const maintenant = useNow();

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Supervision nationale</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Demandes actives" value={demandesActives.length} icon={Activity} />
        <StatCard
          label="Critiques en cours"
          value={critiquesActives}
          icon={Siren}
          tone={critiquesActives > 0 ? "critical" : "neutral"}
        />
        <StatCard
          label="Donneurs mobilisés"
          value={donneursMobilises}
          icon={HeartHandshake}
          tone={donneursMobilises > 0 ? "waiting" : "neutral"}
        />
        <StatCard label="Donneurs disponibles" value={donneursDisponibles} icon={Users} />
      </div>

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
              <CardContent className="flex items-center justify-between gap-3 pt-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-xl text-primary">{demande.groupeSanguin}</p>
                    <UrgencyBadge niveau={demande.niveauUrgence} />
                  </div>
                  <p className="text-sm">{etablissement?.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(demande.createdAt, maintenant)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {candidats.length > 1 && <Badge variant="outline">{candidats.length} candidats</Badge>}
                  <DemandeStatusBadge status={demande.status} />
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
