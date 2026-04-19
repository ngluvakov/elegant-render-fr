/**
 * Collapsible — Shared smooth expand/collapse wrapper.
 *
 * Uses the CSS grid-template-rows 0fr→1fr trick to animate intrinsic height
 * without measuring the child. Zero JS layout work, no extra deps.
 */
"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Collapsible({
  open,
  children,
  className,
  innerClassName,
  duration = 300,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  duration?: number;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] ease-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
      style={{ transitionDuration: `${duration}ms` }}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "min-h-0 overflow-hidden",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
