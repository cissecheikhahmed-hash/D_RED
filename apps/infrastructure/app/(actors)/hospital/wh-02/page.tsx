"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import { formatRelativeTime } from "@d-red/utils";
import { EmptyState } from "@d-red/ui/components/empty-state";
import { ListSkeleton } from "@d-red/ui/components/list-skeleton";
import { StatCard } from "@d-red/ui/components/stat-card";
import { DemandeStatusBadge, UrgencyBadge } from "@d-red/ui/components/status-badges";
import { useNow } from "@d-red/ui/hooks/use-now";
import { Activity, CheckCircle2, Inbox, Plus, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEtablissementSession } from "@/lib/etablissementSession";

/** WH-02 — Dashboard des demandes de l'établissement connecté. */
export default function DashboardPage() {
  const router = useRouter();
  const { etablissementId } = useEtablissementSession();
  const etablissements = useDredStore((s) => s.etablissements);
  const demandes = useDredStore((s) => s.demandes);
  const pret = useDredStore((s) => s.pret);
  const etablissement = etablissements.find((e) => e.id === etablissementId);

  useEffect(() => {
    if (!etablissementId) router.push("/hospital/wh-01");
  }, [etablissementId, router]);

  const mesDemandes = demandes
    .filter((d) => d.etablissementId === etablissementId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const actives = mesDemandes.filter((d) => d.status !== "CLOSED");
  const critiquesActives = actives.filter((d) => d.niveauUrgence === "CRITIQUE").length;
  const cloturees = mesDemandes.length - actives.length;
  const maintenant = useNow();

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Demandes</h1>
          {etablissement && <p className="text-sm text-muted-foreground">{etablissement.ville}</p>}
        </div>
        <Button onClick={() => router.push("/hospital/wh-03")}>
          <Plus className="size-4" />
          Nouvelle urgence
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Demandes actives" value={actives.length} icon={Activity} />
        <StatCard
          label="Critiques en cours"
          value={critiquesActives}
          icon={Siren}
          tone={critiquesActives > 0 ? "critical" : "neutral"}
        />
        <StatCard label="Clôturées" value={cloturees} icon={CheckCircle2} tone="success" />
      </div>

      <div className="flex flex-col gap-3">
        {!pret && <ListSkeleton />}
        {pret && mesDemandes.length === 0 && (
          <EmptyState icon={Inbox} message="Aucune demande active pour cet établissement." />
        )}
        {mesDemandes.map((demande) => (
          <Card
            key={demande.id}
            className="cursor-pointer transition-colors hover:bg-secondary"
            onClick={() => router.push(`/hospital/wh-04/${demande.id}`)}
          >
            <CardContent className="flex items-center justify-between gap-3 pt-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="font-display text-xl text-primary">{demande.groupeSanguin}</p>
                  <UrgencyBadge niveau={demande.niveauUrgence} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(demande.createdAt, maintenant)}
                </p>
              </div>
              <DemandeStatusBadge status={demande.status} />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
