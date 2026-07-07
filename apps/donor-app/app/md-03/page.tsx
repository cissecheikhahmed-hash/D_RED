"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col justify-center gap-6 p-6">
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
      <Button onClick={continuer} disabled={!telephone.trim()}>
        Continuer
      </Button>
    </main>
  );
}
