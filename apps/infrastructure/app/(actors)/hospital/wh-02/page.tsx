"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import { DEMANDE_STATUS_LABELS, NIVEAU_URGENCE_LABELS } from "@d-red/types";
import { formatDateFr } from "@d-red/utils";
import { EmptyState } from "@d-red/ui/components/empty-state";
import { Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEtablissementSession } from "@/lib/etablissementSession";

/** WH-02 — Dashboard des demandes de l'établissement connecté. */
export default function DashboardPage() {
  const router = useRouter();
  const { etablissementId, clearEtablissementId } = useEtablissementSession();
  const etablissements = useDredStore((s) => s.etablissements);
  const demandes = useDredStore((s) => s.demandes);
  const etablissement = etablissements.find((e) => e.id === etablissementId);

  useEffect(() => {
    if (!etablissementId) router.push("/hospital/wh-01");
  }, [etablissementId, router]);

  const mesDemandes = demandes
    .filter((d) => d.etablissementId === etablissementId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{etablissement?.nom}</h1>
          <p className="text-sm text-muted-foreground">{etablissement?.ville}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { clearEtablissementId(); router.push("/hospital/wh-01"); }}>
          Changer
        </Button>
      </div>

      <Button size="lg" onClick={() => router.push("/hospital/wh-03")}>
        + Nouvelle urgence
      </Button>

      <div className="flex flex-col gap-3">
        {mesDemandes.length === 0 && (
          <EmptyState icon={Inbox} message="Aucune demande active pour cet établissement." />
        )}
        {mesDemandes.map((demande) => (
          <Card
            key={demande.id}
            className="cursor-pointer transition-colors hover:bg-secondary"
            onClick={() => router.push(`/hospital/wh-04/${demande.id}`)}
          >
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="font-medium">
                  {demande.groupeSanguin} — {NIVEAU_URGENCE_LABELS[demande.niveauUrgence]}
                </p>
                <p className="text-xs text-muted-foreground">{formatDateFr(demande.createdAt)}</p>
              </div>
              <Badge variant="secondary">{DEMANDE_STATUS_LABELS[demande.status]}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
