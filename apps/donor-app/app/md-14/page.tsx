"use client";

import { useRouter } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import { DEMANDE_STATUS_LABELS, MISSION_STATUS_LABELS } from "@d-red/types";
import { formatDateFr } from "@d-red/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDonneurSession } from "@/lib/donneurSession";

/** MD-14 — Historique des missions du donneur. */
export default function HistoriquePage() {
  const router = useRouter();
  const { session } = useDonneurSession();
  const donneurs = useDredStore((s) => s.donneurs);
  const missions = useDredStore((s) => s.missions);
  const demandes = useDredStore((s) => s.demandes);
  const etablissements = useDredStore((s) => s.etablissements);

  const donneur = donneurs.find((d) => d.id === session.donneurId);
  const mesMissions = missions
    .filter((m) => m.donneurId === session.donneurId)
    .sort((a, b) => (a.notifiedAt < b.notifiedAt ? 1 : -1));

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Historique</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push("/md-06")}>
          Retour
        </Button>
      </div>

      {donneur && <Badge variant="secondary">{donneur.nombreDonsEffectues} dons effectués</Badge>}

      <div className="flex flex-col gap-3">
        {mesMissions.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune mission pour le moment.</p>
        )}
        {mesMissions.map((mission) => {
          const demande = demandes.find((d) => d.id === mission.demandeId);
          const etablissement = etablissements.find((e) => e.id === demande?.etablissementId);
          return (
            <Card key={mission.id}>
              <CardContent className="flex flex-col gap-1 pt-6">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{etablissement?.nom ?? "Établissement"}</p>
                  <Badge variant="outline">{MISSION_STATUS_LABELS[mission.status]}</Badge>
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
    </main>
  );
}
