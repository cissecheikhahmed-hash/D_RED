"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDredStore, dredApi } from "@d-red/sync-client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Screen } from "@/components/screen";

/** MD-09 — Attente de la régulation CNTS après acceptation. */
export default function AttenteRegulationPage() {
  const params = useParams<{ missionId: string }>();
  const router = useRouter();
  const missions = useDredStore((s) => s.missions);
  const mission = missions.find((m) => m.id === params.missionId);
  const [desistementEnCours, setDesistementEnCours] = useState(false);

  useEffect(() => {
    if (!mission) return;
    if (mission.status === "EN_ROUTE") router.push(`/md-11/${mission.id}`);
    if (mission.status === "EJECTED") router.push("/md-06");
  }, [mission, router]);

  async function seDesister() {
    setDesistementEnCours(true);
    try {
      await dredApi.annulerMission(params.missionId);
      router.push("/md-06");
    } finally {
      setDesistementEnCours(false);
    }
  }

  return (
    <Screen className="items-center justify-center gap-6 text-center">
      <Card>
        <CardContent className="flex flex-col items-center gap-3">
          <div className="relative flex size-12 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-duration:1.8s]" />
            <span className="size-3 rounded-full bg-primary" />
          </div>
          <p className="font-medium">En attente de validation par la régulation CNTS</p>
          <p className="text-sm text-muted-foreground">
            Un opérateur confirme votre pré-réservation. Cet écran se met à jour automatiquement.
          </p>
        </CardContent>
      </Card>
      <Button variant="ghost" disabled={desistementEnCours} onClick={seDesister}>
        {desistementEnCours && <Loader2 className="size-4 animate-spin" />}
        Me désister
      </Button>
    </Screen>
  );
}
