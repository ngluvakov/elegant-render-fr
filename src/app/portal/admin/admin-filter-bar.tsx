"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { STATUS_LABELS } from "@/components/portal/status-utils";

const SERVICE_TYPES = [
  "Spoljašnji renderi",
  "Unutrašnji renderi",
  "Stambeni kompleks",
  "Prikazi dvorišta i okruženja",
  "Fotomontaža",
  "3D osnove prostora",
  "2D osnove prostora",
  "3D situacioni prikazi",
  "3D animacija",
  "360 virtuelne ture",
  "Virtuelno opremanje",
  "Virtuelna renovacija",
  "Dan u noć",
  "Uklanjanje elemenata",
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
          placeholder="Pretraži po klijentu, emailu ili broju porudžbine…"
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
        <option value="">Svi statusi</option>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      <select
        value={searchParams.get("usluga") ?? ""}
        onChange={(e) => updateParam("usluga", e.target.value)}
        className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
      >
        <option value="">Sve usluge</option>
        {SERVICE_TYPES.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <select
        value={searchParams.get("placanje") ?? ""}
        onChange={(e) => updateParam("placanje", e.target.value)}
        className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
        title="Filter po načinu plaćanja"
      >
        <option value="">Sva plaćanja</option>
        <option value="online_payment">Online (PayPal/kartica)</option>
        <option value="wire_transfer">Žiro-račun (predračun)</option>
      </select>
    </div>
  );
}
