"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { dredApi } from "@d-red/sync-client";
import { NIVEAU_URGENCE_LABELS, PRODUIT_SANGUIN_LABELS } from "@d-red/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEtablissementSession } from "@/lib/etablissementSession";

const GROUPES_SANGUINS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"] as const;

const schema = z.object({
  groupeSanguin: z.enum(GROUPES_SANGUINS),
  produit: z.enum(["SANG_TOTAL", "PLASMA", "PLAQUETTES", "CONCENTRE_GLOBULAIRE"]),
  niveauUrgence: z.enum(["STANDARD", "PRIORITAIRE", "CRITIQUE"]),
});

type FormValues = z.infer<typeof schema>;

/** WH-03 — Formulaire urgence éclair. Le niveau d'urgence est un champ explicite (pilote le Decision Engine). */
export default function FormulaireUrgencePage() {
  const router = useRouter();
  const { etablissementId } = useEtablissementSession();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { niveauUrgence: "STANDARD", produit: "SANG_TOTAL" },
  });

  async function onSubmit(values: FormValues) {
    if (!etablissementId) return;
    const demande = await dredApi.creerDemande({ etablissementId, ...values });
    router.push(`/hospital/wh-04/${demande.id}`);
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col justify-center gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Urgence éclair</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label>Groupe sanguin</Label>
              <Controller
                control={control}
                name="groupeSanguin"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Groupe sanguin" />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUPES_SANGUINS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Produit</Label>
              <Controller
                control={control}
                name="produit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRODUIT_SANGUIN_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Niveau d&apos;urgence</Label>
              <Controller
                control={control}
                name="niveauUrgence"
                render={({ field }) => (
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="gap-2">
                    {Object.entries(NIVEAU_URGENCE_LABELS).map(([value, label]) => (
                      <label key={value} className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value={value} />
                        {label}
                      </label>
                    ))}
                  </RadioGroup>
                )}
              />
            </div>

            <Button type="submit" size="lg">
              LANCER L&apos;ORCHESTRATION
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
