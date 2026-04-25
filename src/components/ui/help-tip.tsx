/**
 * HelpTip — Tiny `?` icon next to a label that reveals a short
 * explanation on hover or tap. Used to demystify jargon (fotomontaža,
 * hotspot, white-label, phasing) without cluttering the field copy.
 *
 * Wraps base-ui Tooltip; works with hover (desktop) and press (mobile).
 */
"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  label?: string;
};

export function HelpTip({ children, className, label = "Pomoć" }: Props) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        type="button"
        aria-label={label}
        className={cn(
          "inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none",
          className,
        )}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={6}>
          <Tooltip.Popup className="z-50 max-w-[18rem] rounded-lg border border-border/40 bg-popover px-3 py-2 text-[0.78rem] leading-relaxed text-popover-foreground shadow-lg outline-none">
            {children}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
