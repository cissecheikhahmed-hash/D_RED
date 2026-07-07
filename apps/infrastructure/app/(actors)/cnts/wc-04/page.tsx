"use client";

import { useDredStore, dredApi } from "@d-red/sync-client";
import { EmptyState } from "@d-red/ui/components/empty-state";
import { FlaskConical, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** WC-04 — Console labo & dispatch : don effectué, puis envoi du bilan sécurisé. */
export default function ConsoleLaboPage() {
  const demandes = useDredStore((s) => s.demandes);
  const etablissements = useDredStore((s) => s.etablissements);

  const arrivees = demandes.filter((d) => d.status === "ARRIVED");
  const aClore = demandes.filter((d) => d.status === "DONATION_COMPLETED");

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Console labo &amp; dispatch</h1>

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
              <CardContent className="flex items-center justify-between pt-6">
                <span className="font-medium">
                  {demande.groupeSanguin} · {etablissement?.nom}
                </span>
                <Button size="sm" onClick={() => dredApi.marquerDonEffectue(demande.id)}>
                  Don effectué
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
              <CardContent className="flex items-center justify-between pt-6">
                <span className="font-medium">
                  {demande.groupeSanguin} · {etablissement?.nom}
                </span>
                <Button size="sm" onClick={() => dredApi.envoyerBilan(demande.id)}>
                  Envoyer le bilan sécurisé
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
