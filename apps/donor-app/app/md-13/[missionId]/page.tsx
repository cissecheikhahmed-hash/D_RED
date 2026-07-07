"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CelebrationIllustration } from "@/components/illustrations";

/** MD-13 — Clôture / gratification, juste après le scan de réception à l'accueil. */
export default function CloturePage() {
  const router = useRouter();

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <CelebrationIllustration className="size-32" />
      <div>
        <h1 className="text-2xl font-semibold">Merci !</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Votre présence est confirmée. Votre bilan de santé vous sera envoyé par email chiffré
          après votre don.
        </p>
      </div>
      <Button onClick={() => router.push("/md-06")}>Retour à l&apos;accueil</Button>
    </main>
  );
}
