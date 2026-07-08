"use client";

import { useEffect, useState } from "react";
import { dredApi } from "@d-red/sync-client";
import { Bot, Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

/**
 * Panneau présentateur du Mode Démo — jamais lié depuis une navigation
 * visible (écrans Établissement ou CNTS). Accessible uniquement en tapant
 * /demo dans la barre d'adresse, sur la machine du présentateur, pas sur
 * les écrans jury.
 */
export default function ModeDemoPage() {
  const [paused, setPaused] = useState<boolean | null>(null);
  const [autonome, setAutonome] = useState<boolean | null>(null);
  const [dernierPas, setDernierPas] = useState<string | null>(null);

  useEffect(() => {
    void dredApi.modeDemo.status().then((s) => setPaused(s.paused));
    void dredApi.modeAutonome.status().then((s) => setAutonome(s.actif));
  }, []);

  async function jouer() {
    const s = await dredApi.modeDemo.play();
    setPaused(s.paused);
  }

  async function pauser() {
    const s = await dredApi.modeDemo.pause();
    setPaused(s.paused);
  }

  async function avancerDunPas() {
    const s = await dredApi.modeDemo.step();
    setPaused(s.paused);
    setDernierPas(s.advanced ? "Une étape avancée." : "Rien en attente à avancer.");
  }

  async function redemarrer() {
    if (!window.confirm("Réinitialiser toutes les demandes/missions aux données de démo d'origine ?")) {
      return;
    }
    await dredApi.modeDemo.restart();
    const s = await dredApi.modeDemo.status();
    setPaused(s.paused);
    setDernierPas(null);
  }

  async function basculerAutonomie(actif: boolean) {
    const s = actif ? await dredApi.modeAutonome.activer() : await dredApi.modeAutonome.desactiver();
    setAutonome(s.actif);
    if (actif) setPaused(false);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-ink p-6 text-white">
      <Card className="w-full max-w-sm bg-white text-foreground">
        <CardHeader>
          <CardTitle>Mode Démo</CardTitle>
          <p className="text-xs text-muted-foreground">
            Panneau présentateur — ne pas projeter cet écran au jury.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm">
            État du Decision Engine :{" "}
            <span className="font-medium">
              {paused === null ? "…" : paused ? "en pause" : "en lecture"}
            </span>
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={jouer} disabled={paused === false}>
              <Play className="size-4" /> Lecture
            </Button>
            <Button variant="outline" onClick={pauser} disabled={paused === true}>
              <Pause className="size-4" /> Pause
            </Button>
            <Button variant="outline" onClick={avancerDunPas}>
              <StepForward className="size-4" /> Étape suivante
            </Button>
            <Button variant="destructive" onClick={redemarrer}>
              <RotateCcw className="size-4" /> Redémarrer
            </Button>
          </div>

          {dernierPas && <p className="text-xs text-muted-foreground">{dernierPas}</p>}

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Mode Autonome</p>
                <p className="text-xs text-muted-foreground">
                  Le serveur joue seul les rôles Donneur/CNTS/Hôpital, en boucle infinie.
                </p>
              </div>
            </div>
            <Switch checked={autonome ?? false} onCheckedChange={basculerAutonomie} />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
