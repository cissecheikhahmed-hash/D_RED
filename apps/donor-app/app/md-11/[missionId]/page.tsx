"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDredStore, dredApi } from "@d-red/sync-client";
import { distanceKm, formatDistanceKm, formatEtaMinutes, simulateEtaMinutes } from "@d-red/utils";
import { EmptyState } from "@d-red/ui/components/empty-state";
import { Loader2, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteMap } from "@/components/route-map";
import { Screen } from "@/components/screen";

/** MD-11 — Guidage GPS sur carte réelle (tuiles locales) + désengagement. */
export default function GuidagePage() {
  const params = useParams<{ missionId: string }>();
  const router = useRouter();
  const missions = useDredStore((s) => s.missions);
  const demandes = useDredStore((s) => s.demandes);
  const etablissements = useDredStore((s) => s.etablissements);
  const donneurs = useDredStore((s) => s.donneurs);
  const [desistementEnCours, setDesistementEnCours] = useState(false);

  const mission = missions.find((m) => m.id === params.missionId);
  const demande = demandes.find((d) => d.id === mission?.demandeId);
  const etablissement = etablissements.find((e) => e.id === demande?.etablissementId);
  const donneur = donneurs.find((d) => d.id === mission?.donneurId);

  if (!mission || !demande || !etablissement || !donneur) {
    return (
      <Screen className="items-center justify-center gap-4 text-center">
        <EmptyState icon={SearchX} message="Trajet introuvable." />
        <Button onClick={() => router.push("/md-06")}>Retour</Button>
      </Screen>
    );
  }

  const distance = distanceKm(donneur.position, etablissement.position);
  const eta = simulateEtaMinutes(distance);

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
    <Screen className="justify-between">
      <div className="relative min-h-56 flex-1 overflow-hidden rounded-xl border border-border">
        <RouteMap
          depart={donneur.position}
          arrivee={etablissement.position}
          className="absolute inset-0"
        />
      </div>

      <div className="flex flex-col items-center gap-1 py-4 text-center">
        <p className="font-medium">{etablissement.nom}</p>
        <p className="font-display text-4xl text-primary">≈ {formatEtaMinutes(eta)}</p>
        <p className="text-sm text-muted-foreground">{formatDistanceKm(distance)} restants</p>
      </div>

      <div className="flex flex-col gap-2">
        <Button size="lg" onClick={() => router.push(`/md-12/${mission.id}`)}>
          Je suis arrivé(e)
        </Button>
        <Button variant="ghost" disabled={desistementEnCours} onClick={seDesister}>
          {desistementEnCours && <Loader2 className="size-4 animate-spin" />}
          Me désister
        </Button>
      </div>
    </Screen>
  );
}
