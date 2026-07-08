import { cn } from "@/lib/utils";

/**
 * Coquille d'écran commune de l'app Donneur : la même entrée animée et le
 * même padding sur les 14 écrans, au lieu d'une chaîne de classes copiée
 * dans chaque page.
 */
export function Screen({
  className,
  children,
}: {
  className?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <main
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col p-6",
        className,
      )}
    >
      {children}
    </main>
  );
}

/** Titre d'écran unique (h1 + action à droite), utilisé par les écrans hub. */
export function ScreenHeader({
  title,
  action,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">{title}</h1>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
