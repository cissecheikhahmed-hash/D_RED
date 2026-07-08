"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDredStore, dredApi } from "@d-red/sync-client";
import { EmptyState } from "@d-red/ui/components/empty-state";
import { ListSkeleton } from "@d-red/ui/components/list-skeleton";
import { PageHeader } from "@d-red/ui/components/page-header";
import { Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DemandeRow } from "@/components/demande-row";
import { useEtablissementSession } from "@/lib/etablissementSession";
import { masquerNom } from "@/lib/masking";

/** WH-05 — Scan réception QR : confirmation manuelle, pas de fausse caméra. */
export default function ScanReceptionPage() {
  const router = useRouter();
  const { etablissementId } = useEtablissementSession();
  const demandes = useDredStore((s) => s.demandes);
  const donneurs = useDredStore((s) => s.donneurs);
  const pret = useDredStore((s) => s.pret);
  const [enCoursId, setEnCoursId] = useState<string | null>(null);

  const enAttenteArrivee = demandes.filter(
    (d) => d.etablissementId === etablissementId && d.status === "EN_ROUTE",
  );

  async function confirmer(demandeId: string) {
    setEnCoursId(demandeId);
    try {
      await dredApi.marquerArrivee(demandeId);
      toast.success("Réception confirmée — le donneur est pris en charge.");
      router.push(`/hospital/wh-04/${demandeId}`);
    } finally {
      setEnCoursId(null);
    }
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Scan réception"
        subtitle="À l'arrivée du donneur, vérifiez son QR code de mission puis confirmez la réception."
        action={
          <Button variant="ghost" size="sm" onClick={() => router.push("/hospital/wh-02")}>
            Retour
          </Button>
        }
      />

      <div className="flex flex-col gap-3">
        {!pret && <ListSkeleton rows={1} />}
        {pret && enAttenteArrivee.length === 0 && (
          <EmptyState icon={ScanLine} message="Aucun donneur en route pour le moment." />
        )}
        {enAttenteArrivee.map((demande) => {
          const donneur = donneurs.find((d) => d.id === demande.donneurAssigneId);
          return (
            <DemandeRow
              key={demande.id}
              groupe={demande.groupeSanguin}
              meta={donneur ? masquerNom(donneur.nom) : undefined}
              end={
                <Button
                  size="sm"
                  disabled={enCoursId === demande.id}
                  onClick={() => confirmer(demande.id)}
                >
                  {enCoursId === demande.id && <Loader2 className="size-3.5 animate-spin" />}
                  Confirmer la réception
                </Button>
              }
            />
          );
        })}
      </div>
    </main>
  );
}
