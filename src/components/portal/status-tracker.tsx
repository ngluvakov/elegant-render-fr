/**
 * StatusTracker — Horizontal (desktop) / vertical (mobile) 7-step timeline
 * showing order progress from draft to closed.
 *
 * Used on: /portal/porudzbine/[orderId] (order detail page).
 */
import { AlertCircle, Check, Info, MoveRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_STEPS, statusGuidance } from "./status-utils";

type StatusTrackerProps = {
  currentStatus: string;
};

const STATUS_ORDER = STATUS_STEPS.map((s) => s.key);

export function StatusTracker({ currentStatus }: StatusTrackerProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus as (typeof STATUS_ORDER)[number]);
  // If status not in the main flow (e.g. cancelled), show last known
  const activeIndex = currentIndex >= 0 ? currentIndex : STATUS_ORDER.length - 1;
  const guidance = statusGuidance(currentStatus);

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

      {/* Guidance card — what does this status mean for me? */}
      {guidance.description && (
        <div
          className={cn(
            "mt-5 flex items-start gap-3 rounded-xl border px-4 py-3",
            guidance.tone === "action" &&
              "border-accent/30 bg-accent/[0.06]",
            guidance.tone === "info" &&
              "border-[color:var(--color-sage)]/25 bg-[color:var(--color-sage)]/[0.06]",
            guidance.tone === "alert" &&
              "border-destructive/25 bg-destructive/[0.05]",
          )}
        >
          <div
            className={cn(
              "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full",
              guidance.tone === "action" && "bg-accent text-white",
              guidance.tone === "info" &&
                "bg-[color:var(--color-sage-deep)] text-white",
              guidance.tone === "alert" && "bg-destructive text-white",
            )}
          >
            {guidance.tone === "action" ? (
              <MoveRight className="h-3 w-3" />
            ) : guidance.tone === "alert" ? (
              <AlertCircle className="h-3 w-3" />
            ) : (
              <Info className="h-3 w-3" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-[0.78rem] font-semibold",
                guidance.tone === "action" && "text-accent",
                guidance.tone === "info" &&
                  "text-[color:var(--color-sage-deep)]",
                guidance.tone === "alert" && "text-destructive",
              )}
            >
              {guidance.title}
            </p>
            <p className="mt-0.5 text-[0.78rem] leading-relaxed text-muted-foreground">
              {guidance.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
