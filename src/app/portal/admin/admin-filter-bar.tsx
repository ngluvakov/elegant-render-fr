"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { STATUS_LABELS } from "@/components/portal/status-utils";

const SERVICE_TYPES = [
  "Exterior renders",
  "Interior renders",
  "Residential complex",
  "Yard and surroundings views",
  "Photomontage",
  "3D floor plans",
  "2D floor plans",
  "3D site plan views",
  "3D animation",
  "360 virtual tours",
  "Virtual staging",
  "Virtual renovation",
  "Day-to-dusk",
  "Item removal",
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
          placeholder="Search by client, email, or order number..."
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
        <option value="">All services</option>
        {SERVICE_TYPES.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <select
        value={searchParams.get("placanje") ?? ""}
        onChange={(e) => updateParam("placanje", e.target.value)}
        className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
        title="Filter by payment method"
      >
        <option value="">All payments</option>
        <option value="online_payment">Online kartica</option>
        <option value="wire_transfer">Bank transfer (proforma)</option>
      </select>
    </div>
  );
}
