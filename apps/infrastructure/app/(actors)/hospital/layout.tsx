"use client";

import { useRouter } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import { TYPE_ETABLISSEMENT_LABELS } from "@d-red/types";
import { AppShell, type AppShellNavItem } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ICONE_TYPE_ETABLISSEMENT } from "@/lib/etablissementIcons";
import { useEtablissementSession } from "@/lib/etablissementSession";

const NAV: AppShellNavItem[] = [
  { href: "/hospital/wh-02", label: "Demandes", activePrefixes: ["/hospital/wh-04"] },
  { href: "/hospital/wh-03", label: "Nouvelle urgence" },
  { href: "/hospital/wh-05", label: "Scan réception" },
];

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { etablissementId, clearEtablissementId } = useEtablissementSession();
  const etablissements = useDredStore((s) => s.etablissements);
  const etablissement = etablissements.find((e) => e.id === etablissementId);
  const IconeType = etablissement ? ICONE_TYPE_ETABLISSEMENT[etablissement.type] : null;

  return (
    <AppShell
      title={
        etablissement ? (
          <span className="flex items-center gap-2">
            {IconeType && <IconeType className="size-4 shrink-0 text-primary" />}
            <span className="truncate">{etablissement.nom}</span>
            <Badge variant="outline">{TYPE_ETABLISSEMENT_LABELS[etablissement.type]}</Badge>
          </span>
        ) : (
          "Espace Établissement"
        )
      }
      nav={etablissement ? NAV : undefined}
      actions={
        etablissement && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearEtablissementId();
              router.push("/hospital/wh-01");
            }}
          >
            Changer
          </Button>
        )
      }
    >
      {children}
    </AppShell>
  );
}
