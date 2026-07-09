"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { dredApi } from "@d-red/sync-client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RegulationIllustration } from "@/components/illustrations";
import { Screen } from "@/components/screen";
import { useSuiviMission } from "@/lib/useSuiviMission";

/** MD-09 — Attente de la régulation CNTS après acceptation. */
export default function AttenteRegulationPage() {
  const params = useParams<{ missionId: string }>();
  const router = useRouter();
  const [desistementEnCours, setDesistementEnCours] = useState(false);
  useSuiviMission(params.missionId);

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
          <div className="relative flex items-center justify-center">
            <span className="absolute inset-2 animate-ping rounded-full bg-primary/15 [animation-duration:1.8s]" />
            <RegulationIllustration className="animate-in zoom-in-75 duration-500 relative size-28" />
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
