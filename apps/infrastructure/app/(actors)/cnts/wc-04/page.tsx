"use client";

import { useState } from "react";
import { useDredStore, dredApi } from "@d-red/sync-client";
import { EmptyState } from "@d-red/ui/components/empty-state";
import { UrgencyBadge } from "@d-red/ui/components/status-badges";
import { FlaskConical, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** WC-04 — Console labo & dispatch : don effectué, puis envoi du bilan sécurisé. */
export default function ConsoleLaboPage() {
  const demandes = useDredStore((s) => s.demandes);
  const etablissements = useDredStore((s) => s.etablissements);
  const [enCoursId, setEnCoursId] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const arrivees = demandes.filter((d) => d.status === "ARRIVED");
  const aClore = demandes.filter((d) => d.status === "DONATION_COMPLETED");

  async function marquerDonEffectue(demandeId: string) {
    setErreur(null);
    setEnCoursId(demandeId);
    try {
      await dredApi.marquerDonEffectue(demandeId);
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
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Échec de la requête.");
    } finally {
      setEnCoursId(null);
    }
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Console labo &amp; dispatch</h1>

      {erreur && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">{erreur}</CardContent>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Dons arrivés en attente de prélèvement
        </h2>
        {arrivees.length === 0 && (
          <EmptyState icon={FlaskConical} message="Aucun don en attente de prélèvement." />
        )}
        {arrivees.map((demande) => {
          const etablissement = etablissements.find((e) => e.id === demande.etablissementId);
          return (
            <Card key={demande.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-6">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg text-primary">{demande.groupeSanguin}</span>
                  <span className="text-sm">{etablissement?.nom}</span>
                  <UrgencyBadge niveau={demande.niveauUrgence} />
                </div>
                <Button
                  size="sm"
                  disabled={enCoursId === demande.id}
                  onClick={() => marquerDonEffectue(demande.id)}
                >
                  {enCoursId === demande.id ? "…" : "Don effectué"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Bilans à envoyer</h2>
        {aClore.length === 0 && <EmptyState icon={Mail} message="Aucun bilan à envoyer." />}
        {aClore.map((demande) => {
          const etablissement = etablissements.find((e) => e.id === demande.etablissementId);
          return (
            <Card key={demande.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-6">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg text-primary">{demande.groupeSanguin}</span>
                  <span className="text-sm">{etablissement?.nom}</span>
                  <UrgencyBadge niveau={demande.niveauUrgence} />
                </div>
                <Button
                  size="sm"
                  disabled={enCoursId === demande.id}
                  onClick={() => envoyerBilan(demande.id)}
                >
                  {enCoursId === demande.id ? "…" : "Envoyer le bilan sécurisé"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
