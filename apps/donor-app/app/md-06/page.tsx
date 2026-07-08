"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDredStore, dredApi } from "@d-red/sync-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useDonneurSession } from "@/lib/donneurSession";

/** MD-06 — Dashboard / écran de veille du donneur. */
export default function DashboardPage() {
  const router = useRouter();
  const { session, clearSession } = useDonneurSession();
  const donneurs = useDredStore((s) => s.donneurs);
  const missions = useDredStore((s) => s.missions);
  const donneur = donneurs.find((d) => d.id === session.donneurId);

  const mesMissionsActives = missions.filter((m) => m.donneurId === session.donneurId);
  const missionNotifiee = mesMissionsActives.find((m) => m.status === "NOTIFIED");
  const missionPreReservee = mesMissionsActives.find((m) => m.status === "PRE_RESERVED");
  const missionEnRoute = mesMissionsActives.find((m) => m.status === "EN_ROUTE");
  const missionArrivee = mesMissionsActives.find((m) => m.status === "ARRIVED");

  useEffect(() => {
    // Redirige vers l'écran correspondant à l'état le plus avancé de la mission en cours —
    // pas seulement "NOTIFIED" — pour ne jamais laisser le donneur bloqué sur MD-06
    // (ex. après un rechargement de page en plein milieu du Core Loop). Exception : une
    // mission ARRIVED n'exige plus d'action du donneur (QR déjà scanné) — la rediriger
    // enfermait le donneur dans la boucle MD-06 → MD-12 → MD-13 sans retour possible au
    // dashboard tant que le CNTS n'avait pas clôturé ; elle s'affiche en carte ci-dessous.
    if (missionEnRoute) router.push(`/md-11/${missionEnRoute.id}`);
    else if (missionPreReservee) router.push(`/md-09/${missionPreReservee.id}`);
    else if (missionNotifiee) router.push(`/md-07/${missionNotifiee.id}`);
  }, [missionEnRoute, missionPreReservee, missionNotifiee, router]);

  function basculerDisponibilite(disponible: boolean) {
    if (!donneur) return;
    void dredApi.definirDisponibilite(donneur.id, disponible);
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bonjour {donneur?.nom ?? session.nomSaisi}</h1>
        <Button variant="ghost" size="sm" onClick={() => { clearSession(); router.push("/md-03"); }}>
          Changer de profil
        </Button>
      </div>

      {missionArrivee && (
        <Card className="border-success/25 bg-success/5">
          <CardContent className="flex items-center justify-between gap-3 pt-6">
            <div>
              <p className="text-sm font-medium">Don en cours — présence confirmée</p>
              <p className="text-xs text-muted-foreground">
                L&apos;équipe sur place finalise votre don. Merci !
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/md-13/${missionArrivee.id}`)}
            >
              Voir
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Écran de veille</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Disponible pour une mobilisation</span>
            <Switch
              checked={donneur?.disponible ?? false}
              disabled={!donneur}
              onCheckedChange={basculerDisponibilite}
            />
          </div>
          <p className="text-xs text-muted-foreground">Zone de veille : Dakar</p>
          {!donneur && (
            <p className="text-xs text-muted-foreground">
              Compte non vérifié — aucune mobilisation possible pour l&apos;instant.
            </p>
          )}
        </CardContent>
      </Card>

      {donneur && (
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Groupe sanguin</p>
              <p className="font-display text-3xl text-primary">{donneur.groupeSanguin}</p>
            </div>
            <Badge variant="secondary">{donneur.nombreDonsEffectues} dons effectués</Badge>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        <Button variant="outline" onClick={() => router.push("/md-14")}>
          Voir mon historique
        </Button>
        <Button variant="outline" onClick={() => router.push("/md-10")}>
          Voir mes récompenses
        </Button>
      </div>
    </main>
  );
}
