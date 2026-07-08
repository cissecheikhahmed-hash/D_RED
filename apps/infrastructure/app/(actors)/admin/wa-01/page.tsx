"use client";

import { useDredStore } from "@d-red/sync-client";
import { TYPE_ETABLISSEMENT_LABELS } from "@d-red/types";
import { ListSkeleton } from "@d-red/ui/components/list-skeleton";
import { PageHeader } from "@d-red/ui/components/page-header";
import { StatCard } from "@d-red/ui/components/stat-card";
import { Activity, Archive, Building2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * WA-01 — Vue d'ensemble nationale (Admin).
 *
 * Aucun écran Admin n'a jamais été spécifié dans la documentation produit
 * (seule une table de permissions en Phase 2 mentionne ce rôle). Périmètre
 * minimal proposé par l'assistant, pas une spec produit confirmée : lecture
 * seule, aucune action de gestion (pas de création/suppression de comptes)
 * pour rester strictement dans ce qu'on peut raisonnablement déduire sans
 * inventer de fonctionnalité non demandée.
 */
export default function VueEnsembleAdminPage() {
  const etablissements = useDredStore((s) => s.etablissements);
  const donneurs = useDredStore((s) => s.donneurs);
  const demandes = useDredStore((s) => s.demandes);
  const pret = useDredStore((s) => s.pret);

  const donneursVerifies = donneurs.filter((d) => d.statutVerification === "VERIFIE").length;
  const demandesActives = demandes.filter((d) => d.status !== "CLOSED").length;

  const parType = etablissements.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Vue d'ensemble nationale"
        subtitle="Portail Admin — lecture seule sur l'ensemble du réseau."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Établissements" value={etablissements.length} icon={Building2} />
        <StatCard
          label="Donneurs"
          value={donneurs.length}
          icon={Users}
          hint={`dont ${donneursVerifies} vérifiés`}
        />
        <StatCard label="Demandes actives" value={demandesActives} icon={Activity} />
        <StatCard label="Demandes au total" value={demandes.length} icon={Archive} />
      </div>

      {!pret ? (
        <ListSkeleton rows={3} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Établissements du réseau</CardTitle>
            <CardDescription>
              {Object.entries(parType)
                .map(
                  ([type, n]) =>
                    `${n} × ${TYPE_ETABLISSEMENT_LABELS[type as keyof typeof TYPE_ETABLISSEMENT_LABELS]}`,
                )
                .join(" · ")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {etablissements.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{e.nom}</p>
                  <p className="text-xs text-muted-foreground">{e.ville}</p>
                </div>
                <Badge variant="outline">{TYPE_ETABLISSEMENT_LABELS[e.type]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
