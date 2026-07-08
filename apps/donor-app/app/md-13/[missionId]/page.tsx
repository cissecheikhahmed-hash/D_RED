"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CelebrationIllustration } from "@/components/illustrations";

/** MD-13 — Clôture / gratification, juste après le scan de réception à l'accueil. */
export default function CloturePage() {
  const router = useRouter();

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="animate-in zoom-in-75 duration-500 flex items-center justify-center rounded-full bg-success/10 p-6">
        <CelebrationIllustration className="size-32" />
      </div>
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-medium text-success">
          <CheckCircle2 className="size-3.5" />
          Présence confirmée
        </span>
        <h1 className="mt-3 text-2xl font-semibold">Merci !</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Votre présence est confirmée. Votre bilan de santé vous sera envoyé par email chiffré
          après votre don.
        </p>
      </div>
      <Button onClick={() => router.push("/md-06")}>Retour à l&apos;accueil</Button>
    </main>
  );
}
