"use client";

import { useRouter } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import { PRODUIT_SANGUIN_LABELS } from "@d-red/types";
import { formatDateFr } from "@d-red/utils";
import { GroupeSanguinTag } from "@d-red/ui/components/groupe-sanguin-tag";
import { ListSkeleton } from "@d-red/ui/components/list-skeleton";
import { MissionStatusBadge } from "@d-red/ui/components/status-badges";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IllustratedEmpty } from "@/components/illustrated-empty";
import { HistoriqueIllustration } from "@/components/illustrations";
import { Screen, ScreenHeader } from "@/components/screen";
import { useDonneurSession } from "@/lib/donneurSession";

/** MD-14 — Historique des missions du donneur. */
export default function HistoriquePage() {
  const router = useRouter();
  const { session } = useDonneurSession();
  const donneurs = useDredStore((s) => s.donneurs);
  const missions = useDredStore((s) => s.missions);
  const demandes = useDredStore((s) => s.demandes);
  const etablissements = useDredStore((s) => s.etablissements);
  const resultats = useDredStore((s) => s.resultats);
  const pret = useDredStore((s) => s.pret);

  const donneur = donneurs.find((d) => d.id === session.donneurId);
  const mesMissions = missions
    .filter((m) => m.donneurId === session.donneurId)
    .sort((a, b) => (a.notifiedAt < b.notifiedAt ? 1 : -1));

  return (
    <Screen className="gap-6">
      <ScreenHeader
        title="Historique"
        action={
          <Button variant="ghost" size="sm" onClick={() => router.push("/md-06")}>
            Retour
          </Button>
        }
      />

      {donneur && (
        <Card>
          <CardContent className="flex items-center gap-4">
            <HistoriqueIllustration className="size-20 shrink-0" />
            <div className="min-w-0">
              <p className="font-display text-4xl text-primary">{donneur.nombreDonsEffectues}</p>
              <p className="text-sm font-medium">
                don{donneur.nombreDonsEffectues > 1 ? "s" : ""} effectué
                {donneur.nombreDonsEffectues > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Merci pour votre engagement dans le réseau D.RED.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {!pret && <ListSkeleton />}
        {pret && mesMissions.length === 0 && (
          <IllustratedEmpty
            illustration={<HistoriqueIllustration className="size-28" />}
            titre="Aucune mission pour le moment"
            message="Vos missions et bilans d'analyse apparaîtront ici après votre première mobilisation."
          />
        )}
        {mesMissions.map((mission) => {
          const demande = demandes.find((d) => d.id === mission.demandeId);
          const etablissement = etablissements.find((e) => e.id === demande?.etablissementId);
          const resultat = resultats.find((r) => r.missionId === mission.id);
          return (
            <Card key={mission.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {demande && (
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <GroupeSanguinTag groupe={demande.groupeSanguin} taille="sm" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{etablissement?.nom ?? "Établissement"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateFr(mission.notifiedAt)}
                        {demande && ` · ${PRODUIT_SANGUIN_LABELS[demande.produit]}`}
                      </p>
                    </div>
                  </div>
                  <MissionStatusBadge status={mission.status} />
                </div>
                {resultat && (
                  <div className="flex items-center gap-2 rounded-lg bg-success/5 px-3 py-2 text-xs text-success">
                    <MailCheck className="size-3.5 shrink-0" />
                    <span className="min-w-0 truncate">
                      {resultat.canalEnvoiSimule} · {formatDateFr(resultat.envoyeAt)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Screen>
  );
}
