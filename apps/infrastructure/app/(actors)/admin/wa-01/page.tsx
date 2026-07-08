"use client";

import { useDredStore } from "@d-red/sync-client";
import { TYPE_ETABLISSEMENT_LABELS } from "@d-red/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const donneursVerifies = donneurs.filter((d) => d.statutVerification === "VERIFIE").length;
  const demandesActives = demandes.filter((d) => d.status !== "CLOSED").length;

  const parType = etablissements.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Vue d&apos;ensemble nationale</h1>
        <p className="text-xs text-muted-foreground">
          Portail Admin — périmètre minimal (lecture seule), non spécifié par la documentation
          produit d&apos;origine.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-display text-primary">{etablissements.length}</p>
            <p className="text-sm text-muted-foreground">Établissements</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-display text-primary">{donneurs.length}</p>
            <p className="text-sm text-muted-foreground">
              Donneurs ({donneursVerifies} vérifiés)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-display text-primary">{demandesActives}</p>
            <p className="text-sm text-muted-foreground">Demandes actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-display text-primary">{demandes.length}</p>
            <p className="text-sm text-muted-foreground">Demandes au total</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Établissements du réseau</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {etablissements.map((e) => (
            <div key={e.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
              <div>
                <p className="text-sm font-medium">{e.nom}</p>
                <p className="text-xs text-muted-foreground">{e.ville}</p>
              </div>
              <Badge variant="outline">{TYPE_ETABLISSEMENT_LABELS[e.type]}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Répartition : {Object.entries(parType).map(([type, n]) => `${n} ${TYPE_ETABLISSEMENT_LABELS[type as keyof typeof TYPE_ETABLISSEMENT_LABELS]}`).join(" · ")}
      </p>
    </main>
  );
}
