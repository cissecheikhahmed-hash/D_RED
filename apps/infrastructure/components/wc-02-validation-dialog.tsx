"use client";

import { dredApi, useDredStore } from "@d-red/sync-client";
import { formatDateFr } from "@d-red/utils";
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
  missionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** WC-02 — Modale de validation téléphonique, dès qu'un donneur accepte une mission. */
export function ValidationDialog({ demandeId, missionId, open, onOpenChange }: Props) {
  const donneurs = useDredStore((s) => s.donneurs);
  const missions = useDredStore((s) => s.missions);
  const mission = missions.find((m) => m.id === missionId);
  const donneur = donneurs.find((d) => d.id === mission?.donneurId);

  if (!mission || !donneur) return null;

  const fiable = donneur.nombreDonsEffectues >= 3;

  async function confirmer() {
    await dredApi.confirmerDemande(demandeId, missionId);
    onOpenChange(false);
  }

  async function ejecter() {
    await dredApi.ejecterMission(demandeId, missionId);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Validation téléphonique</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-medium">{donneur.nom}</p>
            <Badge variant={fiable ? "default" : "secondary"}>
              {fiable ? "Fiable" : "Nouveau donneur"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{donneur.telephone}</p>
          <p className="text-sm text-muted-foreground">
            {donneur.nombreDonsEffectues} dons effectués
          </p>
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
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={confirmer}>CONFIRMER &amp; VERROUILLER</Button>
          <Button variant="outline" onClick={ejecter}>
            Éjecter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
