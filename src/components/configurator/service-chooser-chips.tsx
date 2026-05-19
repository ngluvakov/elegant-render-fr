/**
 * ServiceChooserChips — Sticky horizontal chip filter bar for /cene.
 *
 * 7 filter chips + a CartChip slot at the right end (separated by a divider).
 * URL-synced via useSearchParams / router.replace. Default filter = "exterior".
 *
 * CHIP_DEFS is exported so TablicaGrid can import the same mapping to stay DRY.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { CartChip } from "./cart-chip";
import { track } from "@/lib/posthog-events";

export type ChipDef = {
  label: string;
  filter: string;
  catIds: string[];
};

export const CHIP_DEFS: ChipDef[] = [
  { label: "Sve", filter: "sve", catIds: ["exterior", "landscape", "interior", "floorplans-3d", "floorplans-2d", "siteplans", "animation", "staging", "renovation", "day-to-dusk", "item-removal", "vr-experiences"] },
  { label: "Eksterijer", filter: "exterior", catIds: ["exterior", "landscape"] },
  { label: "Enterijer", filter: "interior", catIds: ["interior"] },
  { label: "Planovi", filter: "plans", catIds: ["floorplans-3d", "floorplans-2d", "siteplans"] },
  { label: "360 i Animacija", filter: "animation-360", catIds: ["animation"] },
  { label: "Opremanje", filter: "transformation", catIds: ["staging", "renovation", "day-to-dusk", "item-removal"] },
  { label: "VR iskustvo", filter: "vr-experiences", catIds: ["vr-experiences"] },
];

export const DEFAULT_FILTER = "exterior";

export function ServiceChooserChips() {
  const router = useRouter();
  const sp = useSearchParams();
  const activeFilter = sp.get("filter") ?? DEFAULT_FILTER;

  const setFilter = useCallback(
    (filter: string) => {
      const params = new URLSearchParams(sp.toString());
      params.set("filter", filter);
      router.replace(`/cene?${params.toString()}`, { scroll: false });
      track("service_chip_click", { filter });
    },
    [router, sp],
  );

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-3">
      <div className="overflow-x-auto scrollbar-none snap-x snap-mandatory flex gap-2 px-4">
        {CHIP_DEFS.map((chip) => {
          const isActive = chip.filter === activeFilter;
          const isSve = chip.filter === "sve";
          return (
            <button
              key={chip.filter}
              type="button"
              onClick={() => setFilter(chip.filter)}
              className={cn(
                "snap-start shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "bg-secondary/60 text-foreground hover:bg-secondary",
                isSve && "sticky left-0 z-10 bg-background sm:static sm:bg-secondary/60",
                isSve && isActive && "sm:bg-foreground",
              )}
              aria-pressed={isActive}
            >
              {chip.label}
            </button>
          );
        })}

        {/* Vertical divider before CartChip */}
        <div className="w-px bg-border/40 self-stretch mx-2 shrink-0" />

        <CartChip />
      </div>
    </div>
  );
}
