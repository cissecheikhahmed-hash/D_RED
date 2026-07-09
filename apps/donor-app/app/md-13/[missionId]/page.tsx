"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import { formatDateFr, trouverPalier } from "@d-red/utils";
import { EmptyState } from "@d-red/ui/components/empty-state";
import { DotBadge } from "@d-red/ui/components/status-badges";
import { Award, CalendarDays, MailCheck, MapPin, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CarteDon } from "@/components/carte-don";
import { CelebrationIllustration } from "@/components/illustrations";
import { Screen } from "@/components/screen";
import { useSuiviMission } from "@/lib/useSuiviMission";

/**
 * En Mode Autonome (vitrine sans présentateur), l'écran de gratification
 * reste affiché le temps d'être lu puis la fenêtre revient en veille sur
 * MD-06, prête à suivre le cycle suivant.
 */
const DELAI_RETOUR_VEILLE_AUTONOME_MS = 15_000;

/** MD-13 — Clôture / gratification, du scan de réception jusqu'au bilan sécurisé. */
export default function CloturePage() {
  const params = useParams<{ missionId: string }>();
  const router = useRouter();
  const missions = useDredStore((s) => s.missions);
  const demandes = useDredStore((s) => s.demandes);
  const donneurs = useDredStore((s) => s.donneurs);
  const etablissements = useDredStore((s) => s.etablissements);
  const resultats = useDredStore((s) => s.resultats);
  const autonomieActive = useDredStore((s) => s.autonomieActive);
  useSuiviMission(params.missionId);

  const mission = missions.find((m) => m.id === params.missionId);
  const demande = demandes.find((d) => d.id === mission?.demandeId);
  const donneur = donneurs.find((d) => d.id === mission?.donneurId);
  const etablissement = etablissements.find((e) => e.id === demande?.etablissementId);
  const resultat = resultats.find((r) => r.missionId === mission?.id);

  const cloturee = demande?.status === "CLOSED";

  useEffect(() => {
    if (!autonomieActive || !cloturee) return;
    const timer = setTimeout(() => router.push("/md-06"), DELAI_RETOUR_VEILLE_AUTONOME_MS);
    return () => clearTimeout(timer);
  }, [autonomieActive, cloturee, router]);

  if (!mission || !demande || !donneur || !etablissement) {
    return (
      <Screen className="items-center justify-center gap-4 text-center">
        <EmptyState icon={SearchX} message="Mission introuvable." />
        <Button onClick={() => router.push("/md-06")}>Retour</Button>
      </Screen>
    );
  }

  // Don en cours : le QR vient d'être scanné, l'équipe sur place prend le relais.
  if (demande.status === "ARRIVED") {
    return (
      <Screen className="items-center justify-center gap-6 text-center">
        <div className="animate-in zoom-in-75 duration-500 flex items-center justify-center rounded-full bg-waiting/10 p-6">
          <CelebrationIllustration className="size-32" />
        </div>
        <div>
          <DotBadge tone="waiting" pulse>
            Don en cours
          </DotBadge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            Présence confirmée
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            L&apos;équipe de {etablissement.nom}{" "}
            s&apos;occupe de vous. Cet écran se met à jour automatiquement une fois le don validé.
          </p>
        </div>
      </Screen>
    );
  }

  // Statut antérieur au scan (navigation manuelle prématurée) : useSuiviMission redirige.
  if (demande.status !== "DONATION_COMPLETED" && !cloturee) return null;

  const prenom = donneur.nom.split(" ")[0] ?? donneur.nom;
  // Le compteur n'est incrémenté par le serveur qu'à l'envoi du bilan (CLOSED).
  const niemeDon = cloturee ? donneur.nombreDonsEffectues : donneur.nombreDonsEffectues + 1;
  const dateDon =
    demande.historiqueStatuts?.DONATION_COMPLETED ??
    demande.historiqueStatuts?.ARRIVED ??
    demande.createdAt;
  const palier = trouverPalier(donneur.nombreDonsEffectues);

  return (
    <Screen className="items-center gap-6 pt-10 text-center">
      <div className="animate-in zoom-in-75 duration-500 flex items-center justify-center rounded-full bg-success/10 p-6">
        <CelebrationIllustration className="size-28" />
      </div>

      <div>
        <DotBadge tone="success">Don validé</DotBadge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Merci {prenom} !</h1>
        <p className="mt-1 font-display text-lg text-primary">
          {niemeDon === 1 ? "Votre premier don" : `Votre ${niemeDon}ᵉ don`}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
            <CalendarDays className="size-3.5 text-primary" />
            {formatDateFr(dateDon)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
            <MapPin className="size-3.5 text-primary" />
            {etablissement.nom}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
            <Award className="size-3.5 text-primary" />
            Palier {palier.nom}
          </span>
        </div>
      </div>

      <CarteDon
        data={{
          nom: donneur.nom,
          groupeSanguin: donneur.groupeSanguin,
          niemeDon,
          dateISO: dateDon,
          lieu: etablissement.nom,
        }}
      />

      <p className="flex max-w-sm items-start gap-2 text-left text-sm text-muted-foreground">
        <MailCheck className="mt-0.5 size-4 shrink-0 text-success" />
        {cloturee && resultat
          ? resultat.canalEnvoiSimule
          : "Votre bilan de santé vous sera envoyé par email chiffré d'ici quelques minutes."}
      </p>

      <Button size="lg" onClick={() => router.push("/md-06")}>
        Retour à l&apos;accueil
      </Button>
    </Screen>
  );
}
