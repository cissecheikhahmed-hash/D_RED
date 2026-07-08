"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import { formatRelativeTime } from "@d-red/utils";
import { EmptyState } from "@d-red/ui/components/empty-state";
import { ListSkeleton } from "@d-red/ui/components/list-skeleton";
import { PageHeader } from "@d-red/ui/components/page-header";
import { StatCard } from "@d-red/ui/components/stat-card";
import { DemandeStatusBadge, UrgencyBadge } from "@d-red/ui/components/status-badges";
import { useNow } from "@d-red/ui/hooks/use-now";
import { Activity, CheckCircle2, Inbox, Plus, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemandeRow } from "@/components/demande-row";
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
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Demandes"
        subtitle={etablissement ? `${etablissement.nom} · ${etablissement.ville}` : undefined}
        action={
          <Button onClick={() => router.push("/hospital/wh-03")}>
            <Plus className="size-4" />
            Nouvelle urgence
          </Button>
        }
      />

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
          <DemandeRow
            key={demande.id}
            groupe={demande.groupeSanguin}
            badges={<UrgencyBadge niveau={demande.niveauUrgence} />}
            meta={formatRelativeTime(demande.createdAt, maintenant)}
            end={<DemandeStatusBadge status={demande.status} />}
            onClick={() => router.push(`/hospital/wh-04/${demande.id}`)}
          />
        ))}
      </div>
    </main>
  );
}
