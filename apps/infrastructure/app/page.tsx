import Link from "next/link";
import { Building2, ChevronRight, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ESPACES = [
  {
    href: "/hospital/wh-01",
    icone: Building2,
    titre: "Espace Établissement",
    description: "Hôpital, banque de sang ou clinique privée",
  },
  {
    href: "/cnts/wc-01",
    icone: ShieldCheck,
    titre: "Espace CNTS",
    description: "Supervision nationale et régulation",
  },
  {
    href: "/admin/wa-01",
    icone: LayoutDashboard,
    titre: "Espace Admin",
    description: "Vue d'ensemble nationale (lecture seule)",
  },
] as const;

/** Sélecteur d'acteur — cette app sert plusieurs fenêtres distinctes en démo. */
export default function RoleSelectorPage() {
  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="font-display text-5xl text-primary">D.RED</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Digital Blood Response &amp; Exchange Directory
        </p>
        <p className="text-sm font-medium">Choisissez la fenêtre à ouvrir</p>
      </div>
      <div className="grid w-full max-w-md gap-3">
        {ESPACES.map(({ href, icone: Icone, titre, description }) => (
          <Link key={href} href={href} className="group">
            <Card className="transition-all group-hover:-translate-y-0.5 group-hover:shadow-sm">
              <CardContent className="flex items-center gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icone className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">{titre}</span>
                  <span className="text-sm text-muted-foreground">{description}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
