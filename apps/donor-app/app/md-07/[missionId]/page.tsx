"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDredStore, dredApi } from "@d-red/sync-client";
import { distanceKm, formatDistanceKm, formatEtaMinutes, simulateEtaMinutes } from "@d-red/utils";
import { NIVEAU_URGENCE_LABELS, PRODUIT_SANGUIN_LABELS } from "@d-red/types";
import { EmptyState } from "@d-red/ui/components/empty-state";
import { Clock, Loader2, MapPin, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Screen } from "@/components/screen";

/** MD-07 — Fiche mission critique. */
export default function MissionPage() {
  const params = useParams<{ missionId: string }>();
  const router = useRouter();
  const missions = useDredStore((s) => s.missions);
  const demandes = useDredStore((s) => s.demandes);
  const etablissements = useDredStore((s) => s.etablissements);
  const donneurs = useDredStore((s) => s.donneurs);
  const [refusEnCours, setRefusEnCours] = useState(false);

  const mission = missions.find((m) => m.id === params.missionId);
  const demande = demandes.find((d) => d.id === mission?.demandeId);
  const etablissement = etablissements.find((e) => e.id === demande?.etablissementId);
  const donneur = donneurs.find((d) => d.id === mission?.donneurId);

  if (!mission || !demande || !etablissement || mission.status !== "NOTIFIED") {
    return (
      <Screen className="items-center justify-center gap-4 text-center">
        <EmptyState icon={SearchX} message="Cette mission n'est plus disponible." />
        <Button onClick={() => router.push("/md-06")}>Retour</Button>
      </Screen>
    );
  }

  const distance = donneur ? distanceKm(donneur.position, etablissement.position) : 0;
  const eta = simulateEtaMinutes(distance);

  function accepter() {
    router.push(`/md-08/${mission!.id}`);
  }

  async function refuser() {
    setRefusEnCours(true);
    try {
      await dredApi.refuserMission(mission!.id);
      router.push("/md-06");
    } finally {
      setRefusEnCours(false);
    }
  }

  return (
    <Screen className="justify-between gap-6 bg-primary text-primary-foreground">
      <div className="flex flex-col items-center gap-3 pt-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium uppercase tracking-widest">
          <span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" />
          Urgence {NIVEAU_URGENCE_LABELS[demande.niveauUrgence]}
        </span>
        <div className="relative flex items-center justify-center py-8">
          <span className="absolute size-44 animate-ping rounded-full bg-primary-foreground/10 [animation-duration:2s]" />
          <span className="absolute size-32 rounded-full bg-primary-foreground/10" />
          <span className="animate-in zoom-in-50 duration-500 relative font-display text-8xl">
            {demande.groupeSanguin}
          </span>
        </div>
        <p className="text-lg">{PRODUIT_SANGUIN_LABELS[demande.produit]}</p>
        <p className="text-sm text-primary-foreground/70">Un patient a besoin de vous maintenant.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-1">
          <p className="font-medium">{etablissement.nom}</p>
          <p className="text-sm text-muted-foreground">{etablissement.ville}</p>
          <div className="mt-3 flex gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
              <MapPin className="size-3.5 text-primary" />
              {formatDistanceKm(distance)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
              <Clock className="size-3.5 text-primary" />≈ {formatEtaMinutes(eta)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Button size="lg" variant="secondary" onClick={accepter}>
          J&apos;accepte la mission
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          disabled={refusEnCours}
          onClick={refuser}
        >
          {refusEnCours && <Loader2 className="size-4 animate-spin" />}
          Refuser
        </Button>
      </div>
    </Screen>
  );
}
