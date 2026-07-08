"use client";

import { useParams, useRouter } from "next/navigation";
import { useDredStore, dredApi } from "@d-red/sync-client";
import { distanceKm, simulateEtaMinutes } from "@d-red/utils";
import { Button } from "@/components/ui/button";
import { GuidageIllustration } from "@/components/illustrations";

/** MD-11 — Guidage GPS simulé (illustration, pas de vraie carte) + désengagement. */
export default function GuidagePage() {
  const params = useParams<{ missionId: string }>();
  const router = useRouter();
  const missions = useDredStore((s) => s.missions);
  const demandes = useDredStore((s) => s.demandes);
  const etablissements = useDredStore((s) => s.etablissements);
  const donneurs = useDredStore((s) => s.donneurs);

  const mission = missions.find((m) => m.id === params.missionId);
  const demande = demandes.find((d) => d.id === mission?.demandeId);
  const etablissement = etablissements.find((e) => e.id === demande?.etablissementId);
  const donneur = donneurs.find((d) => d.id === mission?.donneurId);

  if (!mission || !demande || !etablissement || !donneur) {
    return (
      <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Trajet introuvable.</p>
      </main>
    );
  }

  const distance = distanceKm(donneur.position, etablissement.position);
  const eta = simulateEtaMinutes(distance);

  async function seDesister() {
    await dredApi.annulerMission(params.missionId);
    router.push("/md-06");
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col justify-between p-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-hidden rounded-xl bg-secondary">
        <GuidageIllustration className="w-full" />
        <p className="text-sm text-muted-foreground">Itinéraire vers {etablissement.nom}</p>
      </div>

      <div className="flex flex-col items-center gap-1 py-4 text-center">
        <p className="font-medium">{etablissement.nom}</p>
        <p className="font-display text-4xl text-primary">≈ {eta} min</p>
        <p className="text-sm text-muted-foreground">{distance.toFixed(1)} km restants</p>
      </div>

      <div className="flex flex-col gap-2">
        <Button size="lg" onClick={() => router.push(`/md-12/${mission.id}`)}>
          Je suis arrivé(e)
        </Button>
        <Button variant="ghost" onClick={seDesister}>
          Me désister
        </Button>
      </div>
    </main>
  );
}
