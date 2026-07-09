"use client";

import { useRouter } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import { PALIERS, prochainPalier, trouverPalier } from "@d-red/utils";
import { ProgressBar } from "@d-red/ui/components/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IllustratedEmpty } from "@/components/illustrated-empty";
import { RecompensesIllustration } from "@/components/illustrations";
import { Screen, ScreenHeader } from "@/components/screen";
import { useDonneurSession } from "@/lib/donneurSession";

/** MD-10 — Récompenses : palier de fidélité calculé à partir du compteur de dons existant. */
export default function RecompensesPage() {
  const router = useRouter();
  const { session } = useDonneurSession();
  const donneurs = useDredStore((s) => s.donneurs);
  const donneur = donneurs.find((d) => d.id === session.donneurId);

  return (
    <Screen className="gap-6">
      <ScreenHeader
        title="Récompenses"
        action={
          <Button variant="ghost" size="sm" onClick={() => router.push("/md-06")}>
            Retour
          </Button>
        }
      />

      {!donneur ? (
        <IllustratedEmpty
          illustration={<RecompensesIllustration className="size-28" />}
          message="Compte non vérifié — les récompenses arrivent après votre premier don validé en personne."
        />
      ) : (
        <RecompensesContenu nombreDons={donneur.nombreDonsEffectues} />
      )}
    </Screen>
  );
}

function RecompensesContenu({ nombreDons }: { nombreDons: number }) {
  const palier = trouverPalier(nombreDons);
  const suivant = prochainPalier(nombreDons);
  const progression = suivant
    ? Math.round(((nombreDons - palier.seuilMin) / (suivant.seuilMin - palier.seuilMin)) * 100)
    : 100;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <RecompensesIllustration className="size-16 shrink-0" />
          <div>
            <CardTitle>Palier {palier.nom}</CardTitle>
            <p className="text-sm text-muted-foreground">{nombreDons} dons effectués</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {suivant ? (
            <>
              <ProgressBar pourcentage={progression} />
              <p className="text-xs text-muted-foreground">
                Encore {suivant.seuilMin - nombreDons} don(s) avant le palier {suivant.nom}
              </p>
            </>
          ) : (
            <p className="text-sm text-success">Palier maximum atteint — merci pour votre engagement !</p>
          )}
        </CardContent>
      </Card>

      <ul className="flex flex-col gap-2">
        {PALIERS.map((p) => {
          const atteint = nombreDons >= p.seuilMin;
          return (
            <li key={p.nom} className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className={atteint ? "font-medium" : "text-muted-foreground"}>{p.nom}</span>
              <Badge variant={atteint ? "default" : "outline"}>
                {atteint ? "Atteint" : `dès ${p.seuilMin} dons`}
              </Badge>
            </li>
          );
        })}
      </ul>
    </>
  );
}
