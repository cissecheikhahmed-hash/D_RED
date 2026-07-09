"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpIllustration } from "@/components/illustrations";
import { Screen } from "@/components/screen";
import { TELEPHONE_TEMP_KEY, useDonneurSession } from "@/lib/donneurSession";

function lireTelephoneTemp(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(TELEPHONE_TEMP_KEY) ?? "";
}

/**
 * Compare les numéros sur leurs 9 derniers chiffres (format national
 * sénégalais) : "+221 77 123 45 05", "771234505" et "77-123-45-05"
 * désignent le même donneur. Sans ça, une saisie sans espaces créait une
 * session sans donneur associé — fenêtre à jamais silencieuse en démo.
 */
function normaliserTelephone(telephone: string): string {
  return telephone.replace(/\D/g, "").slice(-9);
}

/** MD-04 — OTP simulé : n'importe quel code à 4 chiffres est accepté. */
export default function OtpPage() {
  const router = useRouter();
  const { setSession } = useDonneurSession();
  const donneurs = useDredStore((s) => s.donneurs);
  const [telephone] = useState(lireTelephoneTemp);
  const [code, setCode] = useState("");

  function valider() {
    if (code.trim().length < 4) return;
    const match = donneurs.find(
      (d) => normaliserTelephone(d.telephone) === normaliserTelephone(telephone),
    );
    setSession({ telephone, donneurId: match?.id ?? null, nomSaisi: null });
    router.push("/md-05");
  }

  return (
    <Screen className="justify-center gap-6">
      <OtpIllustration className="animate-in zoom-in-75 duration-500 size-28 self-center" />
      <div>
        <h1 className="text-2xl font-semibold">Code de vérification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Un code à 4 chiffres a été envoyé par SMS au {telephone || "numéro saisi"}.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="otp">Code reçu</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          placeholder="0000"
          className="text-center text-lg tracking-[0.5em]"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <Button size="lg" onClick={valider} disabled={code.trim().length < 4}>
        Continuer
      </Button>
    </Screen>
  );
}
