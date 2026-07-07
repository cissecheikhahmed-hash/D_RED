"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** MD-01 — Splash. Temporisation purement locale (pas d'étape métier cross-acteur). */
export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/md-02"), 1600);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col items-center justify-center gap-3 bg-primary text-primary-foreground">
      <h1 className="font-display text-6xl tracking-wide">D.Red</h1>
      <p className="text-sm opacity-80">Chaque seconde compte.</p>
    </main>
  );
}
