"use client";

import { useRouter } from "next/navigation";
import { useDredStore, dredApi } from "@d-red/sync-client";
import { EmptyState } from "@d-red/ui/components/empty-state";
import { ListSkeleton } from "@d-red/ui/components/list-skeleton";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEtablissementSession } from "@/lib/etablissementSession";
import { masquerNom } from "@/lib/masking";

/** WH-05 — Scan réception QR : confirmation manuelle, pas de fausse caméra. */
export default function ScanReceptionPage() {
  const router = useRouter();
  const { etablissementId } = useEtablissementSession();
  const demandes = useDredStore((s) => s.demandes);
  const donneurs = useDredStore((s) => s.donneurs);
  const pret = useDredStore((s) => s.pret);

  const enAttenteArrivee = demandes.filter(
    (d) => d.etablissementId === etablissementId && d.status === "EN_ROUTE",
  );

  async function confirmer(demandeId: string) {
    await dredApi.marquerArrivee(demandeId);
    router.push(`/hospital/wh-04/${demandeId}`);
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Scan réception</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push("/hospital/wh-02")}>
          Retour
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        À l&apos;arrivée du donneur, vérifiez son QR code de mission puis confirmez la réception.
      </p>

      <div className="flex flex-col gap-3">
        {!pret && <ListSkeleton rows={1} />}
        {pret && enAttenteArrivee.length === 0 && (
          <EmptyState icon={ScanLine} message="Aucun donneur en route pour le moment." />
        )}
        {enAttenteArrivee.map((demande) => {
          const donneur = donneurs.find((d) => d.id === demande.donneurAssigneId);
          return (
            <Card key={demande.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-6">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg text-primary">{demande.groupeSanguin}</span>
                  {donneur && <span className="text-sm">{masquerNom(donneur.nom)}</span>}
                </div>
                <Button size="sm" onClick={() => confirmer(demande.id)}>
                  Confirmer la réception
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
