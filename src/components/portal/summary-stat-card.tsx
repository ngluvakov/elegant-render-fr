import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SummaryStatCardProps = {
  icon: LucideIcon;
  label: string;
  value: number;
  accent?: "default" | "clay" | "sage";
};

export function SummaryStatCard({
  icon: Icon,
  label,
  value,
  accent = "default",
}: SummaryStatCardProps) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/80 p-5 shadow-[0_4px_16px_rgba(28,26,25,0.03)]">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accent === "clay" && "bg-accent/10 text-accent",
            accent === "sage" && "bg-[color:var(--color-sage)]/10 text-[color:var(--color-sage-deep)]",
            accent === "default" && "bg-secondary/60 text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
