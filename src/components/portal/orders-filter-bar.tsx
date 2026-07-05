/**
 * OrdersFilterBar — Search input + status dropdown filter for the orders list.
 * Updates URL search params to filter orders.
 *
 * Used on: /portal/orders (orders listing page).
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { STATUS_LABELS } from "./status-utils";

export function OrdersFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "";
  const currentSearch = searchParams.get("q") ?? "";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/portal/orders?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pretraži po broju porudžbine…"
          defaultValue={currentSearch}
          onChange={(e) => updateParam("q", e.target.value)}
          className="pl-9"
        />
      </div>
      <select
        value={currentStatus}
        onChange={(e) => updateParam("status", e.target.value)}
        className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
      >
        <option value="">Svi statusi</option>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
