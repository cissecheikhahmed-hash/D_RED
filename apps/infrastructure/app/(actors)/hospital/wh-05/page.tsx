"use client";

import { useRouter } from "next/navigation";
import { useDredStore, dredApi } from "@d-red/sync-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEtablissementSession } from "@/lib/etablissementSession";

/** WH-05 — Scan réception QR : confirmation manuelle, pas de fausse caméra. */
export default function ScanReceptionPage() {
  const router = useRouter();
  const { etablissementId } = useEtablissementSession();
  const demandes = useDredStore((s) => s.demandes);

  const enAttenteArrivee = demandes.filter(
    (d) => d.etablissementId === etablissementId && d.status === "EN_ROUTE",
  );

  async function confirmer(demandeId: string) {
    await dredApi.marquerArrivee(demandeId);
    router.push(`/hospital/wh-04/${demandeId}`);
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Scan réception</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push("/hospital/wh-02")}>
          Retour
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Confirmez manuellement l&apos;arrivée du donneur (simulation — pas de caméra réelle).
      </p>

      <div className="flex flex-col gap-3">
        {enAttenteArrivee.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun donneur en route pour le moment.</p>
        )}
        {enAttenteArrivee.map((demande) => (
          <Card key={demande.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <span className="font-medium">{demande.groupeSanguin}</span>
              <Button size="sm" onClick={() => confirmer(demande.id)}>
                Confirmer la réception
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
