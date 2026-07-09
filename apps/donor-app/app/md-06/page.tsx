"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDredStore, dredApi } from "@d-red/sync-client";
import { trouverPalier } from "@d-red/utils";
import { GroupeSanguinTag } from "@d-red/ui/components/groupe-sanguin-tag";
import { Award, ChevronRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { BloodDropMark } from "@/components/illustrations";
import { Screen } from "@/components/screen";
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

  const disponible = donneur?.disponible ?? false;

  return (
    <Screen className="gap-0 p-0">
      <div className="relative overflow-hidden rounded-b-3xl bg-primary px-6 pb-14 pt-6 text-primary-foreground">
        <BloodDropMark className="absolute -right-3 -top-5 h-28 w-24 opacity-10" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-primary-foreground/70">Bonjour</p>
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {donneur?.nom ?? session.nomSaisi ?? ""}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={() => {
              clearSession();
              router.push("/md-03");
            }}
          >
            Changer de profil
          </Button>
        </div>
        {donneur && (
          <div className="relative mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary-foreground/15 px-3 py-1 font-display text-xs tracking-wide">
              {donneur.groupeSanguin}
            </span>
            <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs">
              {donneur.statutVerification === "VERIFIE" ? "Donneur vérifié" : "Non vérifié"}
            </span>
          </div>
        )}
      </div>

      <div className="relative -mt-8 flex flex-1 flex-col gap-4 px-6 pb-6">
        {missionArrivee && (
          // Fond opaque obligatoire : cette carte chevauche le héros rouge
          // (-mt-8) — un simple bg-success/5 translucide laissait le rouge
          // transparaître derrière la bannière.
          <Card className="border-success/25 bg-[color-mix(in_srgb,var(--color-success)_6%,var(--color-card))]">
            <CardContent className="flex items-center justify-between gap-3">
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

        <Card className="shadow-lg shadow-ink/5">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  {disponible && (
                    <span className="absolute size-4 animate-ping rounded-full bg-success/30 [animation-duration:1.8s]" />
                  )}
                  <span
                    className={`relative size-2.5 rounded-full ${disponible ? "bg-success" : "bg-muted-foreground/40"}`}
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {disponible ? "Veille active" : "Veille désactivée"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {disponible
                      ? "Vous pouvez être mobilisé — zone : Dakar"
                      : "Aucune mobilisation ne vous sera envoyée"}
                  </p>
                </div>
              </div>
              <Switch
                checked={disponible}
                disabled={!donneur}
                onCheckedChange={basculerDisponibilite}
              />
            </div>
            {!donneur && (
              <p className="text-xs text-muted-foreground">
                Compte non vérifié — aucune mobilisation possible pour l&apos;instant.
              </p>
            )}
          </CardContent>
        </Card>

        {donneur && (
          <Card>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-secondary">
                  <GroupeSanguinTag groupe={donneur.groupeSanguin} taille="lg" />
                </div>
                <div>
                  <p className="text-sm font-medium">Groupe sanguin</p>
                  <p className="text-xs text-muted-foreground">
                    Enregistré auprès du réseau CNTS
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => router.push("/md-14")}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
              <History className="size-4.5" />
            </span>
            <span className="text-sm font-medium">Historique</span>
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              {donneur ? `${donneur.nombreDonsEffectues} don${donneur.nombreDonsEffectues > 1 ? "s" : ""}` : "Voir"}
              <ChevronRight className="size-3.5" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/md-10")}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
              <Award className="size-4.5" />
            </span>
            <span className="text-sm font-medium">Récompenses</span>
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              {donneur ? `Palier ${trouverPalier(donneur.nombreDonsEffectues).nom}` : "Voir"}
              <ChevronRight className="size-3.5" />
            </span>
          </button>
        </div>
      </div>
    </Screen>
  );
}
