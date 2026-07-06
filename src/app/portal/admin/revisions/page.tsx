/**
 * Admin audit log viewer — read-only table of recent AuditLog rows.
 *
 * ISO 27001:2022 control A.8.15 (Logging) requires that consequential
 * actions be reviewable. This is the v1 surface: most-recent 200 rows,
 * filterable by action and entityType via search params. Filters and
 * date-range pickers will land later if needed.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { requirePermission } from "@/lib/admin-auth";
import { normalizeAdminPermissions } from "@/lib/admin-permissions";

export const metadata: Metadata = {
  title: "Audit log — Admin",
  description:
    "Admin audit trail of changes, actions, and activity across the platform.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ action?: string; entity?: string }>;

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission("AUDIT_VIEW");
  const { action, entity } = await searchParams;

  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  if (entity) where.entityType = entity;

  const [logs, totalCount, distinctActions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        actor: {
          select: { id: true, email: true, isAdmin: true, adminPermissions: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-[min(96vw,1400px)] px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Audit log</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Forensic record of admin actions. ISO 27001 A.8.15 and GDPR Art. 32.
            Showing the latest 200 events{" "}
            {action || entity ? "po filteru" : "u sistemu"}.
          </p>
        </div>
        <p className="text-[0.78rem] text-muted-foreground">
          Total in set (filter applied): <strong>{totalCount}</strong>
        </p>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href="/portal/admin/revisions"
          className={filterChip(!action && !entity)}
        >
          All
        </Link>
        {distinctActions.map((a) => (
          <Link
            key={a.action}
            href={`/portal/admin/revisions?action=${encodeURIComponent(a.action)}`}
            className={filterChip(action === a.action)}
          >
            {a.action}
          </Link>
        ))}
      </div>

      {/* Logs table */}
      <div className="mt-6 -mx-2 overflow-x-auto sm:mx-0">
        {logs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 bg-card/40 p-12 text-center text-sm text-muted-foreground">
            No records match the current filter.
          </p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-left text-[0.72rem] font-mono uppercase tracking-[0.08em] text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="px-2 py-3">Time</th>
                <th className="px-2 py-3">Actor</th>
                <th className="px-2 py-3">Action</th>
                <th className="px-2 py-3">Entity</th>
                <th className="px-2 py-3">Details</th>
                <th className="px-2 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground/85">
              {logs.map((log) => {
                const meta =
                  log.metadata && typeof log.metadata === "object"
                    ? JSON.stringify(log.metadata, null, 0)
                    : null;
                return (
                  <tr key={log.id} className="align-top">
                    <td className="whitespace-nowrap px-2 py-3 font-mono text-[0.78rem] text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("en-GB", {
                        year: "2-digit",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-col">
                        <span className="text-[0.85rem] text-foreground">
                          {log.actorEmail ?? log.actor?.email ?? (
                            <em className="text-muted-foreground">— sistem —</em>
                          )}
                        </span>
                        {log.actor &&
                          normalizeAdminPermissions(log.actor.adminPermissions, {
                            isAdmin: log.actor.isAdmin,
                          }).length > 0 && (
                          <Badge variant="secondary" className="mt-1 self-start">
                            admin
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-[0.78rem]">
                        {log.action}
                      </code>
                    </td>
                    <td className="px-2 py-3 text-[0.82rem]">
                      {log.entityType ? (
                        <>
                          <span className="text-muted-foreground">
                            {log.entityType}
                          </span>
                          {log.entityId && (
                            <>
                              {" · "}
                              <code className="rounded bg-secondary/40 px-1 py-0.5 font-mono text-[0.72rem]">
                                {log.entityId.slice(-8)}
                              </code>
                            </>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="max-w-md px-2 py-3">
                      {meta ? (
                        <details className="group">
                          <summary className="cursor-pointer truncate text-[0.78rem] text-muted-foreground hover:text-foreground">
                            {meta.length > 80 ? meta.slice(0, 80) + "…" : meta}
                          </summary>
                          <pre className="mt-2 overflow-auto rounded bg-secondary/40 p-2 text-[0.72rem] leading-relaxed">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 font-mono text-[0.78rem] text-muted-foreground">
                      {log.ipAddress ?? "—"}
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
