import Link from "next/link";
import { Building2, ShieldCheck, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Sélecteur d'acteur — cette app sert deux fenêtres distinctes (Établissement / CNTS) en démo. */
export default function RoleSelectorPage() {
  return (
    <main className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="font-display text-4xl text-primary">D.Red</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choisissez la fenêtre à ouvrir</p>
      </div>
      <div className="grid w-full max-w-md gap-4">
        <Link href="/hospital/wh-01">
          <Card className="transition-colors hover:bg-secondary">
            <CardHeader className="flex flex-row items-center gap-3">
              <Building2 className="size-6 text-primary" />
              <CardTitle>Espace Établissement</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Hôpital, banque de sang ou clinique privée
            </CardContent>
          </Card>
        </Link>
        <Link href="/cnts/wc-01">
          <Card className="transition-colors hover:bg-secondary">
            <CardHeader className="flex flex-row items-center gap-3">
              <ShieldCheck className="size-6 text-primary" />
              <CardTitle>Espace CNTS</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Supervision nationale et régulation
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/wa-01">
          <Card className="transition-colors hover:bg-secondary">
            <CardHeader className="flex flex-row items-center gap-3">
              <LayoutDashboard className="size-6 text-primary" />
              <CardTitle>Espace Admin</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Vue d&apos;ensemble nationale (lecture seule)
            </CardContent>
          </Card>
        </Link>
      </div>
    </main>
  );
}
