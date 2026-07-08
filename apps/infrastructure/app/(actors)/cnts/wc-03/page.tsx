"use client";

import { useEffect, useState } from "react";
import { dredApi } from "@d-red/sync-client";
import { NIVEAU_URGENCE_LABELS, type NiveauUrgence } from "@d-red/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NIVEAUX = Object.keys(NIVEAU_URGENCE_LABELS) as NiveauUrgence[];

/** WC-03 — Configuration des Decision Policies (délai de recherche infrastructure par niveau). */
export default function PolitiquesPage() {
  const [politiques, setPolitiques] = useState<dredApi.Policies | null>(null);
  const [enregistre, setEnregistre] = useState(false);

  useEffect(() => {
    void dredApi.obtenirPolitiques().then(setPolitiques);
  }, []);

  async function modifier(niveau: NiveauUrgence, dureeMs: number) {
    const suivant = await dredApi.definirDureeRecherche(niveau, dureeMs);
    setPolitiques(suivant);
    setEnregistre(true);
    setTimeout(() => setEnregistre(false), 1500);
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Decision Policies</h1>
      <Card>
        <CardHeader>
          <CardTitle>Fenêtre de scan des infrastructures</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Durée totale du balayage des stocks des établissements proches avant la bascule vers
            la mobilisation de donneurs. Le Niveau Critique lance les deux recherches en
            simultané.
          </p>
          {NIVEAUX.map((niveau) => (
            <div key={niveau} className="flex items-center justify-between gap-4">
              <Label className="flex-1">{NIVEAU_URGENCE_LABELS[niveau]}</Label>
              <Input
                type="number"
                step={100}
                className="w-32"
                value={politiques?.dureeRechercheMsParNiveau[niveau] ?? ""}
                onChange={(e) => modifier(niveau, Number(e.target.value))}
              />
              <span className="text-sm text-muted-foreground">ms</span>
            </div>
          ))}
          {enregistre && <p className="text-sm text-success">Enregistré.</p>}
        </CardContent>
      </Card>
    </main>
  );
}
