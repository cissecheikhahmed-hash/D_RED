"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import { cn } from "@/lib/utils";

export interface AppShellNavItem {
  href: string;
  label: string;
  /** Préfixes de routes filles qui gardent l'onglet actif (ex. WH-04 sous "Demandes"). */
  activePrefixes?: string[] | undefined;
}

interface AppShellProps {
  /** Identité de l'espace affichée à côté de la marque (nom d'acteur, établissement…). */
  title: React.ReactNode;
  /** Onglets de navigation de l'espace ; l'onglet actif suit le pathname. */
  nav?: AppShellNavItem[] | undefined;
  /** Actions de droite (ex. "Changer d'établissement"), avant l'indicateur temps réel. */
  actions?: React.ReactNode | undefined;
  children: React.ReactNode;
}

/**
 * Coquille commune des espaces Hôpital / CNTS / Admin : topbar de marque,
 * identité de l'acteur connecté, indicateur de connexion temps réel et
 * contenu centré — chaque page cesse d'être un <main> nu pleine largeur.
 */
export function AppShell({ title, nav, actions, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="font-display text-xl leading-none text-primary">
              D.RED
            </Link>
            <span aria-hidden className="h-4 w-px shrink-0 bg-border" />
            <div className="min-w-0 truncate text-sm font-medium">{title}</div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {actions}
            <ConnectionPill />
          </div>
        </div>
        {nav && nav.length > 0 && (
          <nav className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 sm:px-6">
            {nav.map((item) => {
              const actif = [item.href, ...(item.activePrefixes ?? [])].some((prefix) =>
                pathname.startsWith(prefix),
              );
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors",
                    actif
                      ? "border-primary font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">{children}</div>
    </div>
  );
}

/** Témoin de synchronisation Socket.IO — vert quand l'état temps réel est branché. */
function ConnectionPill() {
  const connecte = useDredStore((s) => s.connecte);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        connecte
          ? "border-success/25 bg-success/10 text-success"
          : "border-waiting/30 bg-waiting/10 text-ink",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          connecte ? "animate-pulse bg-success" : "bg-waiting",
        )}
      />
      {connecte ? "Temps réel" : "Reconnexion…"}
    </span>
  );
}
