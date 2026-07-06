/**
 * SectionKicker — Mono eyebrow label with a solid green tick (international spec:
 * JetBrains Mono 12px, uppercase, +0.08em).
 *
 * Used on: multiple marketing pages (usluge, cene, portfolio, FAQ, etc.).
 * @prop align — "left" | "center"
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionKickerProps = {
  children: ReactNode;
  className?: string;
  align?: "left" | "center";
};

export function SectionKicker({
  children,
  className,
  align = "left",
}: SectionKickerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5",
        align === "center" && "justify-center",
        className,
      )}
    >
      <span aria-hidden className="h-[2px] w-5 bg-accent" />
      <span className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {children}
      </span>
    </div>
  );
}
