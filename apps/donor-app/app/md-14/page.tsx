"use client";

import { useRouter } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import { DEMANDE_STATUS_LABELS } from "@d-red/types";
import { formatDateFr } from "@d-red/utils";
import { EmptyState } from "@d-red/ui/components/empty-state";
import { ListSkeleton } from "@d-red/ui/components/list-skeleton";
import { MissionStatusBadge } from "@d-red/ui/components/status-badges";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Screen, ScreenHeader } from "@/components/screen";
import { useDonneurSession } from "@/lib/donneurSession";

/** MD-14 — Historique des missions du donneur. */
export default function HistoriquePage() {
  const router = useRouter();
  const { session } = useDonneurSession();
  const donneurs = useDredStore((s) => s.donneurs);
  const missions = useDredStore((s) => s.missions);
  const demandes = useDredStore((s) => s.demandes);
  const etablissements = useDredStore((s) => s.etablissements);
  const pret = useDredStore((s) => s.pret);

  const donneur = donneurs.find((d) => d.id === session.donneurId);
  const mesMissions = missions
    .filter((m) => m.donneurId === session.donneurId)
    .sort((a, b) => (a.notifiedAt < b.notifiedAt ? 1 : -1));

  return (
    <Screen className="gap-6">
      <ScreenHeader
        title="Historique"
        action={
          <Button variant="ghost" size="sm" onClick={() => router.push("/md-06")}>
            Retour
          </Button>
        }
      />

      {donneur && <Badge variant="secondary">{donneur.nombreDonsEffectues} dons effectués</Badge>}

      <div className="flex flex-col gap-3">
        {!pret && <ListSkeleton />}
        {pret && mesMissions.length === 0 && (
          <EmptyState icon={History} message="Aucune mission pour le moment." />
        )}
        {mesMissions.map((mission) => {
          const demande = demandes.find((d) => d.id === mission.demandeId);
          const etablissement = etablissements.find((e) => e.id === demande?.etablissementId);
          return (
            <Card key={mission.id}>
              <CardContent className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{etablissement?.nom ?? "Établissement"}</p>
                  <MissionStatusBadge status={mission.status} />
                </div>
                <p className="text-sm text-muted-foreground">{formatDateFr(mission.notifiedAt)}</p>
                {demande && (
                  <p className="text-xs text-muted-foreground">
                    Demande : {DEMANDE_STATUS_LABELS[demande.status]}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Screen>
  );
}
