"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TELEPHONE_TEMP_KEY, useDonneurSession } from "@/lib/donneurSession";

function lireTelephoneTemp(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(TELEPHONE_TEMP_KEY) ?? "";
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
    const match = donneurs.find((d) => d.telephone === telephone);
    setSession({ telephone, donneurId: match?.id ?? null, nomSaisi: null });
    router.push("/md-05");
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col justify-center gap-6 p-6">
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
          maxLength={6}
          placeholder="1234"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <Button onClick={valider} disabled={code.trim().length < 4}>
        Valider
      </Button>
    </main>
  );
}
