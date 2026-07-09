"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TelephoneIllustration } from "@/components/illustrations";
import { Screen } from "@/components/screen";
import { TELEPHONE_TEMP_KEY } from "@/lib/donneurSession";

/** MD-03 — Saisie du téléphone (authentification simulée, pas de vrai SMS envoyé). */
export default function TelephonePage() {
  const router = useRouter();
  const [telephone, setTelephone] = useState("");

  function continuer() {
    if (!telephone.trim()) return;
    sessionStorage.setItem(TELEPHONE_TEMP_KEY, telephone.trim());
    router.push("/md-04");
  }

  return (
    <Screen className="justify-center gap-6">
      <TelephoneIllustration className="animate-in zoom-in-75 duration-500 size-28 self-center" />
      <div>
        <h1 className="text-2xl font-semibold">Votre numéro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Un code de vérification simulé vous sera demandé à l&apos;étape suivante.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="telephone">Téléphone</Label>
        <Input
          id="telephone"
          type="tel"
          placeholder="+221 77 123 45 01"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
        />
      </div>
      <Button size="lg" onClick={continuer} disabled={!telephone.trim()}>
        Continuer
      </Button>
    </Screen>
  );
}
