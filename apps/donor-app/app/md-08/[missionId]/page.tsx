"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { dredApi } from "@d-red/sync-client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Screen } from "@/components/screen";
import { useSuiviMission } from "@/lib/useSuiviMission";

const schema = z.object({
  dateDernierDon: z.string().optional(),
  voyageRecent: z.boolean(),
  traitementEnCours: z.boolean(),
  seSentBien: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const QUESTIONS: Array<{ name: "voyageRecent" | "traitementEnCours" | "seSentBien"; label: string }> = [
  { name: "voyageRecent", label: "Voyage récent hors du pays" },
  { name: "traitementEnCours", label: "Traitement médical en cours" },
  { name: "seSentBien", label: "Je me sens bien aujourd'hui" },
];

/** MD-08 — Questionnaire d'éligibilité rapide, juste après l'acceptation. */
export default function QuestionnairePage() {
  const params = useParams<{ missionId: string }>();
  const router = useRouter();
  useSuiviMission(params.missionId);
  const {
    control,
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { voyageRecent: false, traitementEnCours: false, seSentBien: true },
  });

  async function onSubmit(values: FormValues) {
    await dredApi.accepterMission(params.missionId, {
      dateDernierDon: values.dateDernierDon || null,
      voyageRecent: values.voyageRecent,
      traitementEnCours: values.traitementEnCours,
      seSentBien: values.seSentBien,
    });
    router.push(`/md-09/${params.missionId}`);
  }

  return (
    <Screen className="justify-center gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Questionnaire rapide</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quelques secondes — la régulation CNTS s&apos;appuie sur vos réponses.
        </p>
      </div>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dateDernierDon">Date de votre dernier don (si applicable)</Label>
              <Input id="dateDernierDon" type="date" {...register("dateDernierDon")} />
            </div>
            {QUESTIONS.map(({ name, label }) => (
              <Controller
                key={name}
                control={control}
                name={name}
                render={({ field }) => (
                  <label className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    {label}
                  </label>
                )}
              />
            ))}
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Continuer
            </Button>
          </form>
        </CardContent>
      </Card>
    </Screen>
  );
}
