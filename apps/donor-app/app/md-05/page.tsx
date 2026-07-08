"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDredStore } from "@d-red/sync-client";
import { GroupeSanguinTag } from "@d-red/ui/components/groupe-sanguin-tag";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Screen } from "@/components/screen";
import { useDonneurSession } from "@/lib/donneurSession";

/** MD-05 — Profil initial : profil de démo reconnu par téléphone, ou compte non vérifié. */
export default function ProfilPage() {
  const router = useRouter();
  const { session, setSession } = useDonneurSession();
  const donneurs = useDredStore((s) => s.donneurs);
  const donneur = donneurs.find((d) => d.id === session.donneurId);
  const [nom, setNom] = useState(session.nomSaisi ?? "");

  function continuer() {
    if (!donneur) {
      if (!nom.trim()) return;
      setSession({ ...session, nomSaisi: nom.trim() });
    }
    router.push("/md-06");
  }

  return (
    <Screen className="justify-center gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Votre profil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {donneur ? "Ce numéro correspond à un donneur du réseau." : "Créons votre compte."}
        </p>
      </div>
      {donneur ? (
        <Card>
          <CardHeader>
            <CardTitle>{donneur.nom}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <GroupeSanguinTag groupe={donneur.groupeSanguin} taille="lg" />
              <Badge variant={donneur.statutVerification === "VERIFIE" ? "default" : "secondary"}>
                {donneur.statutVerification === "VERIFIE" ? "Donneur vérifié" : "Non vérifié"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{donneur.telephone}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nouveau compte</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Ce numéro n&apos;est pas encore un donneur vérifié. Vous devenez éligible à la
              mobilisation après une validation en personne lors d&apos;un don ou d&apos;une
              campagne.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nom">Votre nom</Label>
              <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom complet" />
            </div>
          </CardContent>
        </Card>
      )}
      <Button size="lg" onClick={continuer} disabled={!donneur && !nom.trim()}>
        Continuer
      </Button>
    </Screen>
  );
}
