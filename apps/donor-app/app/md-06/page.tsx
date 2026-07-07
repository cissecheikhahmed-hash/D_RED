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

  const missionEnCours = missions.find(
    (m) => m.donneurId === session.donneurId && m.status === "NOTIFIED",
  );

  useEffect(() => {
    if (missionEnCours) router.push(`/md-07/${missionEnCours.id}`);
  }, [missionEnCours, router]);

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

      <Card>
        <CardHeader>
          <CardTitle>Écran de veille</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Disponible pour une mobilisation</span>
            <Switch
              defaultChecked={donneur?.disponible ?? false}
              disabled={!donneur}
              onCheckedChange={basculerDisponibilite}
            />
          </div>
          <p className="text-xs text-muted-foreground">Position simulée : Dakar</p>
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

      <Button variant="outline" onClick={() => router.push("/md-14")}>
        Voir mon historique
      </Button>
    </main>
  );
}
