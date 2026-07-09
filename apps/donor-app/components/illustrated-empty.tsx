/** État vide illustré des écrans hub (MD-10, MD-14) — pendant local de EmptyState avec un SVG maison à la place de l'icône. */
export function IllustratedEmpty({
  illustration,
  titre,
  message,
}: {
  illustration: React.ReactNode;
  titre?: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-10 text-center">
      {illustration}
      {titre && <p className="text-sm font-medium">{titre}</p>}
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
