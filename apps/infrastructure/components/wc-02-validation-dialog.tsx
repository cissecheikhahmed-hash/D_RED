"use client";

import { dredApi, useDredStore } from "@d-red/sync-client";
import type { Mission } from "@d-red/types";
import { formatDateFr } from "@d-red/utils";
import { DotBadge } from "@d-red/ui/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  demandeId: string;
  missions: Mission[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * WC-02 — Modale de validation téléphonique. Avec le Niveau Critique, plus
 * d'un candidat peut être actif à la fois (Scénario E) : la modale liste
 * alors tous les candidats en cours (en attente de réponse ou déjà accepté)
 * pour comparaison, plutôt qu'une fiche à candidat unique.
 */
export function ValidationDialog({ demandeId, missions, open, onOpenChange }: Props) {
  async function confirmer(missionId: string) {
    await dredApi.confirmerDemande(demandeId, missionId);
    onOpenChange(false);
  }

  async function ejecter(missionId: string) {
    await dredApi.ejecterMission(demandeId, missionId);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {missions.length > 1 ? "Comparaison des candidats" : "Validation téléphonique"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {missions.map((mission) => (
            <CandidatCard
              key={mission.id}
              mission={mission}
              onConfirmer={() => confirmer(mission.id)}
              onEjecter={() => ejecter(mission.id)}
            />
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CandidatCard({
  mission,
  onConfirmer,
  onEjecter,
}: {
  mission: Mission;
  onConfirmer: () => void;
  onEjecter: () => void;
}) {
  const donneurs = useDredStore((s) => s.donneurs);
  const donneur = donneurs.find((d) => d.id === mission.donneurId);
  if (!donneur) return null;

  const fiable = donneur.nombreDonsEffectues >= 3;
  const enAttente = mission.status === "NOTIFIED";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="font-medium">{donneur.nom}</p>
        <Badge variant={fiable ? "default" : "secondary"}>{fiable ? "Fiable" : "Nouveau donneur"}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{donneur.telephone}</p>
      <p className="text-sm text-muted-foreground">{donneur.nombreDonsEffectues} dons effectués</p>

      {enAttente ? (
        <DotBadge tone="waiting" pulse className="w-fit">
          En attente de réponse du donneur
        </DotBadge>
      ) : (
        <>
          {mission.questionnaire && (
            <div className="rounded-lg bg-secondary p-3 text-sm">
              <p>
                Dernier don :{" "}
                {mission.questionnaire.dateDernierDon
                  ? formatDateFr(mission.questionnaire.dateDernierDon)
                  : "aucun connu"}
              </p>
              <p>Voyage récent : {mission.questionnaire.voyageRecent ? "Oui" : "Non"}</p>
              <p>Traitement en cours : {mission.questionnaire.traitementEnCours ? "Oui" : "Non"}</p>
              <p>Se sent bien : {mission.questionnaire.seSentBien ? "Oui" : "Non"}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={onConfirmer}>
              CONFIRMER &amp; VERROUILLER
            </Button>
            <Button size="sm" variant="outline" onClick={onEjecter}>
              Éjecter
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
