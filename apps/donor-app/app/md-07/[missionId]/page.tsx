"use client";

import { useParams, useRouter } from "next/navigation";
import { useDredStore, dredApi } from "@d-red/sync-client";
import { distanceKm, simulateEtaMinutes } from "@d-red/utils";
import { NIVEAU_URGENCE_LABELS, PRODUIT_SANGUIN_LABELS } from "@d-red/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** MD-07 — Fiche mission critique. */
export default function MissionPage() {
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

  if (!mission || !demande || !etablissement || mission.status !== "NOTIFIED") {
    return (
      <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-muted-foreground">Cette mission n&apos;est plus disponible.</p>
        <Button onClick={() => router.push("/md-06")}>Retour à l&apos;accueil</Button>
      </main>
    );
  }

  const distance = donneur ? distanceKm(donneur.position, etablissement.position) : 0;
  const eta = simulateEtaMinutes(distance);

  async function accepter() {
    router.push(`/md-08/${mission!.id}`);
  }

  async function refuser() {
    await dredApi.refuserMission(mission!.id);
    router.push("/md-06");
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col justify-between gap-6 bg-primary p-6 text-primary-foreground">
      <div className="flex flex-col items-center gap-3 pt-8 text-center">
        <Badge variant="secondary">{NIVEAU_URGENCE_LABELS[demande.niveauUrgence]}</Badge>
        <span className="animate-in zoom-in-50 duration-500 font-display text-8xl">
          {demande.groupeSanguin}
        </span>
        <p className="text-lg">{PRODUIT_SANGUIN_LABELS[demande.produit]}</p>
      </div>

      <Card className="bg-white text-foreground">
        <CardContent className="flex flex-col gap-2 pt-6">
          <p className="font-medium">{etablissement.nom}</p>
          <p className="text-sm text-muted-foreground">{etablissement.ville}</p>
          <div className="mt-2 flex justify-between text-sm">
            <span>{distance.toFixed(1)} km</span>
            <span>≈ {eta} min</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Button size="lg" variant="secondary" onClick={accepter}>
          J&apos;ACCEPTE LA MISSION
        </Button>
        <Button size="lg" variant="ghost" className="text-primary-foreground" onClick={refuser}>
          Refuser
        </Button>
      </div>
    </main>
  );
}
