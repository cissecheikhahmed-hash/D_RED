"use client";

import { useParams, useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { useDredStore } from "@d-red/sync-client";
import { DEMANDE_STATUS_LABELS, type DemandeStatus } from "@d-red/types";
import { formatHeureFr } from "@d-red/utils";
import { DemandeStatusBadge, DotBadge, UrgencyBadge } from "@d-red/ui/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { masquerNom } from "@/lib/masking";

/** Niveau Standard : recherche infrastructure uniquement, aucun donneur jamais mobilisé. */
const ETAPES_INFRA: DemandeStatus[] = ["CREATED", "SCANNING_INFRAS", "CLOSED"];

/** Niveaux Prioritaire/Critique : mobilisation donneur, rendu toujours séquentiel. */
const ETAPES_DONNEUR: DemandeStatus[] = [
  "CREATED",
  "SCANNING_INFRAS",
  "DONORS_NOTIFIED",
  "PRE_RESERVED",
  "EN_ROUTE",
  "ARRIVED",
  "DONATION_COMPLETED",
  "CLOSED",
];

/** Statuts pendant lesquels le Niveau Critique affiche encore la recherche parallèle. */
const STATUTS_PHASE_RECHERCHE = new Set<DemandeStatus>([
  "CREATED",
  "SCANNING_INFRAS",
  "DONORS_NOTIFIED",
  "PRE_RESERVED",
]);

const LABEL_ETAPE_INFRA_FINALE = "Poche compatible trouvée";

/** WH-04 — Timeline temps réel. Niveau Critique : rendu parallèle pendant la recherche (Scénario I). */
export default function TimelinePage() {
  const params = useParams<{ demandeId: string }>();
  const router = useRouter();
  const demandes = useDredStore((s) => s.demandes);
  const donneurs = useDredStore((s) => s.donneurs);
  const missions = useDredStore((s) => s.missions);
  const demande = demandes.find((d) => d.id === params.demandeId);
  const donneurAssigne = donneurs.find((d) => d.id === demande?.donneurAssigneId);

  if (!demande) {
    return (
      <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Demande introuvable.</p>
      </main>
    );
  }

  const viaInfraSeule = demande.niveauUrgence === "STANDARD";
  const etapes = viaInfraSeule ? ETAPES_INFRA : ETAPES_DONNEUR;
  const indexActuel = etapes.indexOf(demande.status);

  const missionsActives = missions.filter(
    (m) => m.demandeId === demande.id && (m.status === "NOTIFIED" || m.status === "PRE_RESERVED"),
  );
  const missionActive = missions.find(
    (m) =>
      m.demandeId === demande.id &&
      (m.status === "NOTIFIED" || m.status === "PRE_RESERVED" || m.status === "EN_ROUTE"),
  );
  const rechercheEpuisee =
    !viaInfraSeule &&
    demande.status === "DONORS_NOTIFIED" &&
    !missionActive &&
    missions.some((m) => m.demandeId === demande.id);

  const rechercheParallele =
    demande.niveauUrgence === "CRITIQUE" && STATUTS_PHASE_RECHERCHE.has(demande.status);

  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl text-primary">{demande.groupeSanguin}</h1>
          <UrgencyBadge niveau={demande.niveauUrgence} />
          <DemandeStatusBadge status={demande.status} />
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push("/hospital/wh-02")}>
          Retour
        </Button>
      </div>

      {donneurAssigne && (
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <span className="text-sm">Donneur assigné</span>
            <Badge variant="secondary">{masquerNom(donneurAssigne.nom)}</Badge>
          </CardContent>
        </Card>
      )}

      {rechercheEpuisee && (
        <Card className="border-waiting">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Aucun donneur disponible dans le rayon de mobilisation pour le moment. La recherche
            continue automatiquement dès qu&apos;un donneur compatible devient disponible.
          </CardContent>
        </Card>
      )}

      {rechercheParallele ? (
        <RechercheParallele donneurs={donneurs} missionsActives={missionsActives} />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <ol className="flex flex-col">
              {etapes.map((etape, i) => {
                const derniereEtapeInfra = viaInfraSeule && etape === "CLOSED";
                const label = derniereEtapeInfra
                  ? LABEL_ETAPE_INFRA_FINALE
                  : DEMANDE_STATUS_LABELS[etape];
                // La dernière étape atteinte est un état terminal : on la rend
                // "faite" (coche) plutôt qu'éternellement pulsée.
                const etat: EtatEtape =
                  i < indexActuel || (i === indexActuel && i === etapes.length - 1)
                    ? "faite"
                    : i === indexActuel
                      ? "courante"
                      : "a-venir";
                return (
                  <EtapeTimeline
                    key={etape}
                    label={label}
                    numero={i + 1}
                    etat={etat}
                    derniere={i === etapes.length - 1}
                    horodatage={demande.historiqueStatuts?.[etape]}
                  />
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      {(demande.status === "EN_ROUTE" || demande.status === "ARRIVED") && (
        <Button onClick={() => router.push("/hospital/wh-05")}>Aller au scan de réception</Button>
      )}
    </main>
  );
}

type EtatEtape = "faite" | "courante" | "a-venir";

/** Étape de la timeline verticale : coche rouge (faite), nœud pulsé (courante), estompée (à venir). */
function EtapeTimeline({
  label,
  numero,
  etat,
  derniere,
  horodatage,
}: {
  label: string;
  numero: number;
  etat: EtatEtape;
  derniere: boolean;
  /** Heure d'entrée dans le statut (ISO), si le serveur l'a enregistrée. */
  horodatage?: string | undefined;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        {etat === "faite" ? (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3.5" />
          </span>
        ) : etat === "courante" ? (
          <span className="relative flex size-6 shrink-0 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/25 [animation-duration:1.8s]" />
            <span className="relative flex size-6 items-center justify-center rounded-full border-2 border-primary bg-white">
              <span className="size-2 rounded-full bg-primary" />
            </span>
          </span>
        ) : (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-white text-xs text-muted-foreground">
            {numero}
          </span>
        )}
        {!derniere && (
          <span className={`w-px flex-1 ${etat === "faite" ? "bg-primary/40" : "bg-border"}`} />
        )}
      </div>
      <div className={`flex flex-1 items-baseline justify-between gap-3 pt-1 ${derniere ? "" : "pb-6"}`}>
        <span
          className={
            etat === "courante"
              ? "font-semibold"
              : etat === "faite"
                ? "font-medium"
                : "text-muted-foreground"
          }
        >
          {label}
          {etat === "courante" && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">en cours…</span>
          )}
        </span>
        {horodatage && etat !== "a-venir" && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatHeureFr(horodatage)}
          </span>
        )}
      </div>
    </li>
  );
}

/**
 * Niveau Critique — recherche infrastructure ET donneurs en parallèle
 * (Phase 2), rendue comme deux voies actives simultanément plutôt qu'une
 * timeline séquentielle. Chaque candidat donneur est affiché avec son nom
 * masqué (privacy côté hôpital) et son état (en attente / a accepté).
 */
function RechercheParallele({
  donneurs,
  missionsActives,
}: {
  donneurs: ReturnType<typeof useDredStore.getState>["donneurs"];
  missionsActives: ReturnType<typeof useDredStore.getState>["missions"];
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card>
        <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm font-medium">Recherche infrastructure</p>
          <p className="text-xs text-muted-foreground">Poches compatibles à proximité</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-2 pt-6">
          <div className="flex items-center justify-center gap-2 text-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
          <p className="text-center text-sm font-medium">Recherche donneurs</p>
          {missionsActives.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground">Contact en cours…</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {missionsActives.map((m) => {
                const donneur = donneurs.find((d) => d.id === m.donneurId);
                return (
                  <li key={m.id} className="flex items-center justify-between text-xs">
                    <span>{donneur ? masquerNom(donneur.nom) : "Donneur"}</span>
                    <DotBadge
                      tone={m.status === "PRE_RESERVED" ? "success" : "waiting"}
                      pulse={m.status !== "PRE_RESERVED"}
                    >
                      {m.status === "PRE_RESERVED" ? "A accepté" : "En attente"}
                    </DotBadge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
