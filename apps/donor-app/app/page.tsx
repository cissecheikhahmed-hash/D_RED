"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BloodDropMark } from "@/components/illustrations";
import { Screen } from "@/components/screen";

/** MD-01 — Splash. Temporisation purement locale (pas d'étape métier cross-acteur). */
export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/md-02"), 1600);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Screen className="items-center justify-center gap-4 bg-primary p-0 text-primary-foreground">
      <BloodDropMark className="h-20 w-16" />
      <h1 className="font-display text-6xl tracking-wide">D.RED</h1>
      <p className="text-sm text-primary-foreground/80">Chaque seconde compte.</p>
    </Screen>
  );
}
