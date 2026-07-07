import {
  donneurs as donneursSeed,
  etablissements as etablissementsSeed,
  demandes as demandesSeed,
  missions as missionsSeed,
  resultats as resultatsSeed,
} from "@d-red/mock-data";
import type { Demande, Donneur, Etablissement, Mission, ResultatAnalyse } from "@d-red/types";

/**
 * État en mémoire uniquement — aucune persistance, aucune base de données.
 * Réinitialisé à chaque redémarrage du processus, ou manuellement via
 * Mode Démo ("restart"). C'est la seule source de vérité partagée entre
 * les fenêtres Donneur/Hôpital/CNTS ouvertes en simultané.
 */
class Store {
  donneurs: Donneur[] = [];
  etablissements: Etablissement[] = [];
  demandes: Demande[] = [];
  missions: Mission[] = [];
  resultats: ResultatAnalyse[] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.donneurs = structuredClone(donneursSeed);
    this.etablissements = structuredClone(etablissementsSeed);
    this.demandes = structuredClone(demandesSeed);
    this.missions = structuredClone(missionsSeed);
    this.resultats = structuredClone(resultatsSeed);
  }

  snapshot() {
    return {
      donneurs: this.donneurs,
      etablissements: this.etablissements,
      demandes: this.demandes,
      missions: this.missions,
      resultats: this.resultats,
    };
  }

  getDemande(id: string): Demande | undefined {
    return this.demandes.find((d) => d.id === id);
  }

  getMission(id: string): Mission | undefined {
    return this.missions.find((m) => m.id === id);
  }

  getDonneur(id: string): Donneur | undefined {
    return this.donneurs.find((d) => d.id === id);
  }

  missionsForDemande(demandeId: string): Mission[] {
    return this.missions.filter((m) => m.demandeId === demandeId);
  }
}

export const store = new Store();
export type Snapshot = ReturnType<Store["snapshot"]>;
