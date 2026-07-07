"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDredStore, dredApi } from "@d-red/sync-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** MD-09 — Attente de la régulation CNTS après acceptation. */
export default function AttenteRegulationPage() {
  const params = useParams<{ missionId: string }>();
  const router = useRouter();
  const missions = useDredStore((s) => s.missions);
  const mission = missions.find((m) => m.id === params.missionId);

  useEffect(() => {
    if (!mission) return;
    if (mission.status === "EN_ROUTE") router.push(`/md-11/${mission.id}`);
    if (mission.status === "EJECTED") router.push("/md-06");
  }, [mission, router]);

  async function seDesister() {
    await dredApi.annulerMission(params.missionId);
    router.push("/md-06");
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6">
          <div className="size-3 animate-pulse rounded-full bg-primary" />
          <p className="font-medium">En attente de validation par la régulation CNTS</p>
          <p className="text-sm text-muted-foreground">
            Un opérateur confirme votre pré-réservation. Cet écran se met à jour automatiquement.
          </p>
        </CardContent>
      </Card>
      <Button variant="ghost" onClick={seDesister}>
        Me désister
      </Button>
    </main>
  );
}
