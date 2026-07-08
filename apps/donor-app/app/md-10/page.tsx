"use client";

import { useRouter } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import { PALIERS, prochainPalier, trouverPalier } from "@d-red/utils";
import { Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDonneurSession } from "@/lib/donneurSession";

/** MD-10 — Récompenses : palier de fidélité calculé à partir du compteur de dons existant. */
export default function RecompensesPage() {
  const router = useRouter();
  const { session } = useDonneurSession();
  const donneurs = useDredStore((s) => s.donneurs);
  const donneur = donneurs.find((d) => d.id === session.donneurId);

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Récompenses</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push("/md-06")}>
          Retour
        </Button>
      </div>

      {!donneur ? (
        <p className="text-sm text-muted-foreground">
          Compte non vérifié — les récompenses arrivent après votre premier don validé en personne.
        </p>
      ) : (
        <RecompensesContenu nombreDons={donneur.nombreDonsEffectues} />
      )}
    </main>
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
          <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
            <Award className="size-7" />
          </div>
          <div>
            <CardTitle>Palier {palier.nom}</CardTitle>
            <p className="text-sm text-muted-foreground">{nombreDons} dons effectués</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {suivant ? (
            <>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progression}%` }}
                />
              </div>
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
