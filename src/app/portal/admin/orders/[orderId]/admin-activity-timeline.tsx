/**
 * AdminActivityTimeline — server component that renders a unified
 * chronological feed of OrderStatusEvent + order-scoped AuditLog
 * rows. Replaces the implicit timeline that admins were previously
 * piecing together from the status changer dropdown, the invoice
 * panel, and the comments thread.
 */
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  ShieldAlert,
} from "lucide-react";
import {
  buildOrderActivityTimeline,
  type TimelineEntry,
} from "@/lib/order/activity-timeline";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const TONE_STYLES: Record<
  TimelineEntry["tone"],
  { dot: string; icon: typeof Circle }
> = {
  neutral: { dot: "bg-muted-foreground/30 text-muted-foreground", icon: Circle },
  success: {
    dot: "bg-accent/15 text-foreground",
    icon: CheckCircle2,
  },
  warning: { dot: "bg-accent/15 text-accent", icon: AlertCircle },
  danger: { dot: "bg-destructive/15 text-destructive", icon: ShieldAlert },
};

export async function AdminActivityTimeline({
  orderId,
}: {
  orderId: string;
}) {
  const entries = await buildOrderActivityTimeline(orderId);

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-border/40 bg-card/60 p-5">
        <h3 className="text-sm font-semibold text-foreground">Historique</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          Aucun événement enregistré pour cette commande pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/40 bg-card/60 p-5">
      <h3 className="text-sm font-semibold text-foreground">
        Historique ({entries.length})
      </h3>
      <ol className="mt-4 space-y-3">
        {entries.map((entry, idx) => {
          const tone = TONE_STYLES[entry.tone];
          const Icon = tone.icon;
          return (
            <li
              key={`${entry.source}-${entry.at.getTime()}-${idx}`}
              className="flex gap-3"
            >
              <div
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${tone.dot}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="font-medium text-foreground">{entry.label}</p>
                  <span className="text-[0.7rem] text-muted-foreground/80">
                    {dateFormatter.format(entry.at)}
                  </span>
                </div>
                {entry.detail && (
                  <p className="mt-0.5 text-muted-foreground/90 break-words">
                    {entry.detail}
                  </p>
                )}
                {entry.actor && (
                  <p className="mt-0.5 text-[0.7rem] text-muted-foreground/70">
                    {entry.actor}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
