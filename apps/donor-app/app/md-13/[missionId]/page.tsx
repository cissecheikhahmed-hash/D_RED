"use client";

import { useRouter } from "next/navigation";
import { DotBadge } from "@d-red/ui/components/status-badges";
import { Button } from "@/components/ui/button";
import { CelebrationIllustration } from "@/components/illustrations";
import { Screen } from "@/components/screen";

/** MD-13 — Clôture / gratification, juste après le scan de réception à l'accueil. */
export default function CloturePage() {
  const router = useRouter();

  return (
    <Screen className="items-center justify-center gap-6 text-center">
      <div className="animate-in zoom-in-75 duration-500 flex items-center justify-center rounded-full bg-success/10 p-6">
        <CelebrationIllustration className="size-32" />
      </div>
      <div>
        <DotBadge tone="success">Présence confirmée</DotBadge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Merci !</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Votre présence est confirmée. Votre bilan de santé vous sera envoyé par email chiffré
          après votre don.
        </p>
      </div>
      <Button size="lg" onClick={() => router.push("/md-06")}>
        Retour à l&apos;accueil
      </Button>
    </Screen>
  );
}
