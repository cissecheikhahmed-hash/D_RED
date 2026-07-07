"use client";

import { useParams, useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useDredStore } from "@d-red/sync-client";
import { DEMANDE_STATUS_LABELS, type DemandeStatus } from "@d-red/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { masquerNom } from "@/lib/masking";

const ETAPES: DemandeStatus[] = [
  "CREATED",
  "SCANNING_INFRAS",
  "DONORS_NOTIFIED",
  "PRE_RESERVED",
  "EN_ROUTE",
  "ARRIVED",
  "DONATION_COMPLETED",
  "CLOSED",
];

/** WH-04 — Timeline temps réel, toujours séquentielle (y compris pour le Niveau Critique). */
export default function TimelinePage() {
  const params = useParams<{ demandeId: string }>();
  const router = useRouter();
  const demandes = useDredStore((s) => s.demandes);
  const donneurs = useDredStore((s) => s.donneurs);
  const demande = demandes.find((d) => d.id === params.demandeId);
  const donneurAssigne = donneurs.find((d) => d.id === demande?.donneurAssigneId);

  if (!demande) {
    return (
      <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Demande introuvable.</p>
      </main>
    );
  }

  const indexActuel = ETAPES.indexOf(demande.status);

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {demande.groupeSanguin} — {DEMANDE_STATUS_LABELS[demande.status]}
        </h1>
        <Button variant="ghost" size="sm" onClick={() => router.push("/hospital/wh-02")}>
          Retour
        </Button>
      </div>

      {donneurAssigne && (
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <span className="text-sm">Donneur assigné</span>
            <Badge variant="secondary">{masquerNom(donneurAssigne.nom)}</Badge>
          </CardContent>
        </Card>
      )}

      <ol className="flex flex-col gap-3">
        {ETAPES.map((etape, i) => {
          const atteinte = i <= indexActuel;
          return (
            <li key={etape} className="flex items-center gap-3">
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs ${
                  atteinte ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {atteinte ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={atteinte ? "font-medium" : "text-muted-foreground"}>
                {DEMANDE_STATUS_LABELS[etape]}
              </span>
            </li>
          );
        })}
      </ol>

      {(demande.status === "EN_ROUTE" || demande.status === "ARRIVED") && (
        <Button onClick={() => router.push("/hospital/wh-05")}>Aller au scan de réception</Button>
      )}
    </main>
  );
}
