/**
 * Outbox observability — read-only dashboard over the OutboxEvent
 * table that powers transactional emails (order confirmation,
 * predračun, faktura, inquiry-converted, AI credit reminders, etc).
 *
 * Lets admin see at a glance whether the cron processor is moving
 * rows and triage failed deliveries (e.g. Resend domain not yet
 * verified → invoice emails pile up in `failed`). Each failed row
 * gets a one-click "Pošalji ponovo" button that resets it to
 * pending; the cron picks it up on the next tick.
 *
 * Filterable by status via search params; default view shows all
 * statuses ordered most-recent first. Limit 200 rows so the page
 * stays cheap even when the table grows.
 */
import type { Metadata } from "next";
import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { prisma } from "@/lib/db";
import type { OutboxEventStatus } from "@/generated/prisma/client";
import { RetryOutboxButton } from "./retry-button";

export const metadata: Metadata = {
  title: "Outbox — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string }>;

const VALID_STATUSES = new Set<OutboxEventStatus>([
  "pending",
  "running",
  "succeeded",
  "failed",
]);

const STATUS_META: Record<
  OutboxEventStatus,
  { label: string; tone: string; icon: typeof Clock }
> = {
  pending: {
    label: "Čeka",
    tone: "bg-muted-foreground/15 text-muted-foreground",
    icon: Clock,
  },
  running: {
    label: "U radu",
    tone: "bg-accent/15 text-accent",
    icon: Loader2,
  },
  succeeded: {
    label: "Uspešno",
    tone: "bg-[color:var(--color-sage)]/15 text-[color:var(--color-sage-deep)]",
    icon: CheckCircle2,
  },
  failed: {
    label: "Neuspeh",
    tone: "bg-destructive/15 text-destructive",
    icon: AlertCircle,
  },
};

const dateFormatter = new Intl.DateTimeFormat("sr-Latn-RS", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export default async function AdminOutboxPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status } = await searchParams;
  const filter =
    status && VALID_STATUSES.has(status as OutboxEventStatus)
      ? (status as OutboxEventStatus)
      : undefined;

  const where = filter ? { status: filter } : {};

  const [events, counts] = await Promise.all([
    prisma.outboxEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.outboxEvent.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all]),
  ) as Record<OutboxEventStatus, number>;
  const totalCount = counts.reduce((sum, c) => sum + c._count._all, 0);

  return (
    <div className="mx-auto w-full max-w-[min(96vw,1400px)] px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Outbox</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Cron procesor obrađuje transakcione emailove (predračuni,
          fakture, potvrde porudžbina, AI krediti). Ako Resend ima
          ispad ili domen nije verifikovan, redovi se nakupljaju u{" "}
          <strong>Neuspeh</strong> — fix-uj uzrok i klikni{" "}
          {"„Pošalji ponovo”"}.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(["pending", "running", "succeeded", "failed"] as const).map(
          (s) => {
            const meta = STATUS_META[s];
            const Icon = meta.icon;
            return (
              <a
                key={s}
                href={`/portal/admin/outbox?status=${s}`}
                className={`flex items-center justify-between rounded-2xl border border-border/40 bg-card/60 p-5 transition hover:border-foreground/30 ${
                  filter === s ? "border-foreground/50" : ""
                }`}
              >
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {meta.label}
                  </p>
                  <p className="mt-1 font-heading text-2xl text-foreground">
                    {countByStatus[s] ?? 0}
                  </p>
                </div>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${meta.tone}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </a>
            );
          },
        )}
      </div>

      {/* Filter chips */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <a
          href="/portal/admin/outbox"
          className={filterChip(!filter)}
        >
          Sve · {totalCount}
        </a>
        {(["pending", "running", "succeeded", "failed"] as const).map(
          (s) => (
            <a
              key={s}
              href={`/portal/admin/outbox?status=${s}`}
              className={filterChip(filter === s)}
            >
              {STATUS_META[s].label} · {countByStatus[s] ?? 0}
            </a>
          ),
        )}
      </div>

      {/* Events table */}
      <div className="mt-6 -mx-2 overflow-x-auto sm:mx-0">
        {events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 bg-card/40 p-12 text-center text-sm text-muted-foreground">
            Nema redova u skupu.
          </p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-left text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="px-2 py-3">Vreme</th>
                <th className="px-2 py-3">Tip</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">Poks.</th>
                <th className="px-2 py-3">Sledeći pokušaj</th>
                <th className="px-2 py-3">Greška</th>
                <th className="px-2 py-3 text-right">Akcija</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground/85">
              {events.map((ev) => {
                const meta = STATUS_META[ev.status];
                return (
                  <tr key={ev.id} className="align-top">
                    <td className="whitespace-nowrap px-2 py-3 font-mono text-[0.78rem] text-muted-foreground">
                      {dateFormatter.format(ev.createdAt)}
                    </td>
                    <td className="px-2 py-3">
                      <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-[0.78rem]">
                        {ev.type}
                      </code>
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.72rem] font-medium ${meta.tone}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-[0.78rem] tabular-nums">
                      {ev.attempts} / {ev.maxAttempts}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-[0.78rem] text-muted-foreground">
                      {ev.status === "pending" || ev.status === "running"
                        ? dateFormatter.format(ev.nextAttemptAt)
                        : ev.succeededAt
                          ? `↑ ${dateFormatter.format(ev.succeededAt)}`
                          : "—"}
                    </td>
                    <td className="max-w-md px-2 py-3 text-[0.78rem] text-destructive/80">
                      {ev.lastError ? (
                        <details>
                          <summary className="cursor-pointer truncate hover:text-destructive">
                            {ev.lastError.length > 80
                              ? ev.lastError.slice(0, 80) + "…"
                              : ev.lastError}
                          </summary>
                          <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded bg-destructive/5 p-2 text-[0.72rem] leading-relaxed text-destructive">
                            {ev.lastError}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-right">
                      {ev.status === "failed" && (
                        <RetryOutboxButton eventId={ev.id} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function filterChip(active: boolean): string {
  return active
    ? "rounded-full bg-foreground px-3 py-1 text-[0.78rem] font-medium text-background"
    : "rounded-full border border-border bg-card px-3 py-1 text-[0.78rem] text-foreground transition hover:bg-secondary";
}
