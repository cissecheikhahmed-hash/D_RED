"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useDredStore } from "@d-red/sync-client";
import { EmptyState } from "@d-red/ui/components/empty-state";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Screen } from "@/components/screen";

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
      <Screen className="items-center justify-center gap-4 text-center">
        <EmptyState icon={SearchX} message="Mission introuvable." />
        <Button onClick={() => router.push("/md-06")}>Retour</Button>
      </Screen>
    );
  }

  return (
    <Screen className="items-center justify-center gap-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Présentez ce code à l&apos;accueil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          L&apos;équipe sur place scanne ce QR pour confirmer votre arrivée. Cet écran avance
          automatiquement dès le scan.
        </p>
      </div>
      <Card>
        <CardContent>
          <QRCodeSVG value={demande.id} size={220} />
        </CardContent>
      </Card>
      <Button variant="ghost" onClick={() => router.push(`/md-11/${mission.id}`)}>
        Retour au guidage
      </Button>
    </Screen>
  );
}
