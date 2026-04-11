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
      <span
        aria-hidden
        className="h-px w-10 bg-gradient-to-r from-accent to-transparent opacity-90"
      />
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {children}
      </span>
    </div>
  );
}
