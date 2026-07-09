"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dessinerCarteDon,
  exporterPngDepuisCanvas,
  TAILLE_CARTE,
  type CarteDonData,
} from "@/lib/carteDon";

interface CarteDonProps {
  data: CarteDonData;
}

/**
 * Carte de don partageable : prévisualisation canvas + export PNG réel.
 * "Partager" passe par la feuille de partage native du téléphone
 * (Web Share API) ; hors contexte sécurisé ou sans support fichiers,
 * on retombe proprement sur le téléchargement.
 */
export function CarteDon({ data }: CarteDonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { nom, groupeSanguin, niemeDon, dateISO, lieu } = data;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    void dessinerCarteDon(canvas, { nom, groupeSanguin, niemeDon, dateISO, lieu });
  }, [nom, groupeSanguin, niemeDon, dateISO, lieu]);

  const nomFichier = `dred-don-${niemeDon}.png`;

  async function exporter(): Promise<Blob | null> {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    setOccupe(true);
    try {
      return await exporterPngDepuisCanvas(canvas);
    } catch {
      setMessage("Export impossible sur cet appareil.");
      return null;
    } finally {
      setOccupe(false);
    }
  }

  function telechargerBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = nomFichier;
    lien.click();
    URL.revokeObjectURL(url);
  }

  async function telecharger() {
    const blob = await exporter();
    if (blob) telechargerBlob(blob);
  }

  async function partager() {
    const blob = await exporter();
    if (!blob) return;
    const fichier = new File([blob], nomFichier, { type: "image/png" });
    const partage = {
      files: [fichier],
      title: "Mon don de sang",
      text: "J'ai donné mon sang avec D.RED — chaque don compte.",
    };
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [fichier] })) {
      try {
        await navigator.share(partage);
        return;
      } catch {
        return; // partage annulé par l'utilisateur : rien à faire
      }
    }
    telechargerBlob(blob);
    setMessage("Partage natif indisponible ici — la carte a été téléchargée.");
  }

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <canvas
        ref={canvasRef}
        width={TAILLE_CARTE}
        height={TAILLE_CARTE}
        role="img"
        aria-label={`Carte de don n°${niemeDon} de ${nom}`}
        className="w-full rounded-xl border border-border shadow-lg shadow-ink/10"
      />
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" disabled={occupe} onClick={telecharger}>
          {occupe ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Télécharger
        </Button>
        <Button disabled={occupe} onClick={partager}>
          {occupe ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
          Partager
        </Button>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
