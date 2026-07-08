"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import { TYPE_ETABLISSEMENT_LABELS } from "@d-red/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEtablissementSession } from "@/lib/etablissementSession";

/** WH-01 — Connexion (choix de l'établissement joué par cette fenêtre, pas de vraie authentification). */
export default function ConnexionPage() {
  const router = useRouter();
  const etablissements = useDredStore((s) => s.etablissements);
  const pret = useDredStore((s) => s.pret);
  const { setEtablissementId } = useEtablissementSession();
  const [selection, setSelection] = useState<string>("");

  function continuer() {
    if (!selection) return;
    setEtablissementId(selection);
    router.push("/hospital/wh-02");
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Espace Établissement</CardTitle>
          <CardDescription>
            Choisissez l&apos;établissement joué par cette fenêtre de démonstration.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Établissement</Label>
            <Select value={selection} onValueChange={(value) => setSelection(value ?? "")}>
              <SelectTrigger className="w-full" disabled={!pret}>
                <SelectValue
                  placeholder={pret ? "Choisissez votre établissement" : "Chargement du réseau…"}
                />
              </SelectTrigger>
              <SelectContent>
                {etablissements.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nom} — {TYPE_ETABLISSEMENT_LABELS[e.type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={continuer} disabled={!selection}>
            Se connecter
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
