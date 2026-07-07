"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useDredStore } from "@d-red/sync-client";
import { Card, CardContent } from "@/components/ui/card";

/** MD-12 — QR code présenté à l'accueil de l'établissement (généré côté client, purement visuel). */
export default function QrCodePage() {
  const params = useParams<{ missionId: string }>();
  const router = useRouter();
  const missions = useDredStore((s) => s.missions);
  const demandes = useDredStore((s) => s.demandes);

  const mission = missions.find((m) => m.id === params.missionId);
  const demande = demandes.find((d) => d.id === mission?.demandeId);

  useEffect(() => {
    if (demande?.status === "ARRIVED") router.push(`/md-13/${params.missionId}`);
  }, [demande, params.missionId, router]);

  if (!mission || !demande) {
    return (
      <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Mission introuvable.</p>
      </main>
    );
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div>
        <h1 className="text-xl font-semibold">Présentez ce code à l&apos;accueil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          L&apos;équipe sur place scanne ce QR pour confirmer votre arrivée.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <QRCodeSVG value={demande.id} size={220} />
        </CardContent>
      </Card>
    </main>
  );
}
