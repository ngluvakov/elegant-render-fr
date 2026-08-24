"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { STATUS_LABELS } from "@/components/portal/status-utils";

const SERVICE_TYPES = [
  "Rendus d’extérieur",
  "Rendus d’intérieur",
  "Ensemble résidentiel",
  "Vues du jardin et des abords",
  "Photomontage",
  "Plans 3D",
  "Plans 2D",
  "Plans de masse 3D",
  "Animation 3D",
  "Visites virtuelles 360°",
  "Home staging virtuel",
  "Rénovation virtuelle",
  "Jour au crépuscule",
  "Suppression d’objets",
];

export function AdminFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/portal/admin?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par client, e-mail ou numéro de commande…"
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => updateParam("q", e.target.value)}
          className="pl-9"
        />
      </div>
      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
      >
        <option value="">Tous les statuts</option>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      <select
        value={searchParams.get("usluga") ?? ""}
        onChange={(e) => updateParam("usluga", e.target.value)}
        className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
      >
        <option value="">Tous les services</option>
        {SERVICE_TYPES.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <select
        value={searchParams.get("placanje") ?? ""}
        onChange={(e) => updateParam("placanje", e.target.value)}
        className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
        title="Filtrer par mode de paiement"
      >
        <option value="">Tous les paiements</option>
        <option value="online_payment">Paiement par carte en ligne</option>
        <option value="wire_transfer">Virement bancaire (proforma)</option>
      </select>
    </div>
  );
}
