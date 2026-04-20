/**
 * StatusTracker — Horizontal (desktop) / vertical (mobile) 7-step timeline
 * showing order progress from draft to closed.
 *
 * Used on: /portal/porudzbine/[orderId] (order detail page).
 */
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_STEPS } from "./status-utils";

type StatusTrackerProps = {
  currentStatus: string;
};

const STATUS_ORDER = STATUS_STEPS.map((s) => s.key);

export function StatusTracker({ currentStatus }: StatusTrackerProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus as (typeof STATUS_ORDER)[number]);
  // If status not in the main flow (e.g. cancelled), show last known
  const activeIndex = currentIndex >= 0 ? currentIndex : STATUS_ORDER.length - 1;

  return (
    <div className="mt-6 rounded-2xl border border-border/40 bg-card/60 p-5">
      {/* Desktop: horizontal */}
      <div className="hidden items-center sm:flex">
        {STATUS_STEPS.map((step, i) => {
          const isCompleted = i < activeIndex;
          const isActive = i === activeIndex;
          const isFuture = i > activeIndex;

          return (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    isCompleted && "bg-[color:var(--color-sage)] text-white",
                    isActive && "bg-accent text-white shadow-[0_4px_12px_rgba(184,131,99,0.3)]",
                    isFuture && "bg-secondary text-muted-foreground/40",
                  )}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[0.72rem] font-medium",
                    isCompleted && "text-[color:var(--color-sage-deep)]",
                    isActive && "text-foreground",
                    isFuture && "text-muted-foreground/40",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-px flex-1",
                    i < activeIndex
                      ? "bg-[color:var(--color-sage)]/40"
                      : "bg-border/40",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical */}
      <div className="space-y-3 sm:hidden">
        {STATUS_STEPS.map((step, i) => {
          const isCompleted = i < activeIndex;
          const isActive = i === activeIndex;
          const isFuture = i > activeIndex;

          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[0.72rem] font-semibold",
                  isCompleted && "bg-[color:var(--color-sage)] text-white",
                  isActive && "bg-accent text-white",
                  isFuture && "bg-secondary text-muted-foreground/40",
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-sm",
                  isActive && "font-semibold text-foreground",
                  isCompleted && "text-muted-foreground",
                  isFuture && "text-muted-foreground/40",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
