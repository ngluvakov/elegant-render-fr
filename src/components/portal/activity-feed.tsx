/**
 * ActivityFeed — Chronological list of recent order events (status changes,
 * comments, uploads) shown on the portal dashboard.
 *
 * Used on: /portal (dashboard page).
 */
type ActivityEvent = {
  id: string;
  orderNumber: string;
  orderId: string;
  description: string;
  createdAt: Date;
};

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        Nema nedavne aktivnosti.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-center justify-between rounded-xl bg-card/60 px-4 py-3"
        >
          <div>
            <p className="text-sm text-foreground">{event.description}</p>
            <p className="text-[0.65rem] text-muted-foreground">
              {event.orderNumber}
            </p>
          </div>
          <p className="flex-shrink-0 text-[0.65rem] text-muted-foreground">
            {event.createdAt.toLocaleDateString("sr-Latn-RS", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      ))}
    </div>
  );
}
