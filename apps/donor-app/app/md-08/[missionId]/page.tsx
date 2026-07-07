"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { dredApi } from "@d-red/sync-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  dateDernierDon: z.string().optional(),
  voyageRecent: z.boolean(),
  traitementEnCours: z.boolean(),
  seSentBien: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

/** MD-08 — Questionnaire d'éligibilité rapide, juste après l'acceptation. */
export default function QuestionnairePage() {
  const params = useParams<{ missionId: string }>();
  const router = useRouter();
  const { register, handleSubmit } = useForm<FormValues>({
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
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col justify-center gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Questionnaire rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dateDernierDon">Date de votre dernier don (si applicable)</Label>
              <Input id="dateDernierDon" type="date" {...register("dateDernierDon")} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("voyageRecent")} />
              Voyage récent hors du pays
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("traitementEnCours")} />
              Traitement médical en cours
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked {...register("seSentBien")} />
              Je me sens bien aujourd&apos;hui
            </label>
            <Button type="submit">Envoyer</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
