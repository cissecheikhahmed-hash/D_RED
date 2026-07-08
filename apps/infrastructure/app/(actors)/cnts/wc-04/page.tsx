"use client";

import { useState } from "react";
import { useDredStore, dredApi } from "@d-red/sync-client";
import { EmptyState } from "@d-red/ui/components/empty-state";
import { ListSkeleton } from "@d-red/ui/components/list-skeleton";
import { PageHeader } from "@d-red/ui/components/page-header";
import { UrgencyBadge } from "@d-red/ui/components/status-badges";
import { FlaskConical, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DemandeRow } from "@/components/demande-row";

/** WC-04 — Console labo : validation du don, puis envoi du bilan sécurisé au donneur. */
export default function ConsoleLaboPage() {
  const demandes = useDredStore((s) => s.demandes);
  const etablissements = useDredStore((s) => s.etablissements);
  const pret = useDredStore((s) => s.pret);
  const [enCoursId, setEnCoursId] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const arrivees = demandes.filter((d) => d.status === "ARRIVED");
  const aClore = demandes.filter((d) => d.status === "DONATION_COMPLETED");

  async function marquerDonEffectue(demandeId: string) {
    setErreur(null);
    setEnCoursId(demandeId);
    try {
      await dredApi.marquerDonEffectue(demandeId);
      toast.success("Don validé — la demande passe au bilan.");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Échec de la requête.");
    } finally {
      setEnCoursId(null);
    }
  }

  async function envoyerBilan(demandeId: string) {
    setErreur(null);
    setEnCoursId(demandeId);
    try {
      await dredApi.envoyerBilan(demandeId);
      toast.success("Bilan sécurisé envoyé — demande clôturée.");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Échec de la requête.");
    } finally {
      setEnCoursId(null);
    }
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Console labo"
        subtitle="Validation des dons à l'arrivée, puis envoi du bilan sécurisé au donneur."
      />

      {erreur && (
        <Card className="border-destructive">
          <CardContent className="text-sm text-destructive">{erreur}</CardContent>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Dons arrivés en attente de prélèvement
        </h2>
        {!pret && <ListSkeleton rows={1} />}
        {pret && arrivees.length === 0 && (
          <EmptyState icon={FlaskConical} message="Aucun don en attente de prélèvement." />
        )}
        {arrivees.map((demande) => {
          const etablissement = etablissements.find((e) => e.id === demande.etablissementId);
          return (
            <DemandeRow
              key={demande.id}
              groupe={demande.groupeSanguin}
              badges={<UrgencyBadge niveau={demande.niveauUrgence} />}
              meta={etablissement?.nom}
              end={
                <Button
                  size="sm"
                  disabled={enCoursId === demande.id}
                  onClick={() => marquerDonEffectue(demande.id)}
                >
                  {enCoursId === demande.id && <Loader2 className="size-3.5 animate-spin" />}
                  Don effectué
                </Button>
              }
            />
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Bilans à envoyer</h2>
        {!pret && <ListSkeleton rows={1} />}
        {pret && aClore.length === 0 && <EmptyState icon={Mail} message="Aucun bilan à envoyer." />}
        {aClore.map((demande) => {
          const etablissement = etablissements.find((e) => e.id === demande.etablissementId);
          return (
            <DemandeRow
              key={demande.id}
              groupe={demande.groupeSanguin}
              badges={<UrgencyBadge niveau={demande.niveauUrgence} />}
              meta={etablissement?.nom}
              end={
                <Button
                  size="sm"
                  disabled={enCoursId === demande.id}
                  onClick={() => envoyerBilan(demande.id)}
                >
                  {enCoursId === demande.id && <Loader2 className="size-3.5 animate-spin" />}
                  Envoyer le bilan sécurisé
                </Button>
              }
            />
          );
        })}
      </section>
    </main>
  );
}
