import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatRsd } from "@/lib/catalog/calculate";
import { statusLabel, statusAccent } from "@/components/portal/status-utils";
import { AdminFilterBar } from "./admin-filter-bar";
import { adminHas, requireAnyAdminPermission } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin — Upravljanje platformom",
  description:
    "Operativni admin pregled porudžbina, korisnika, statusa i zadataka za upravljanje platformom.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  status?: string;
  q?: string;
  usluga?: string;
  placanje?: string;
}>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status, q, usluga, placanje } = await searchParams;
  const admin = await requireAnyAdminPermission();
  const canViewProjects = adminHas(admin, "PROJECTS_VIEW");
  const canViewFinance = adminHas(admin, "FINANCE_VIEW");
  const canViewUsers = adminHas(admin, "USERS_VIEW");
  const canManageInquiries = adminHas(admin, "INQUIRIES_MANAGE");
  const canViewAnalytics = adminHas(admin, "ANALYTICS_VIEW");
  const canViewAudit = adminHas(admin, "AUDIT_VIEW");
  const canManageSystem = adminHas(admin, "SYSTEM_MANAGE");
  const canManagePricing = adminHas(admin, "FINANCE_MANAGE");

  // Build filter
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (usluga) {
    where.items = { some: { categoryLabel: { contains: usluga, mode: "insensitive" } } };
  }
  if (placanje === "online_payment" || placanje === "wire_transfer") {
    where.paymentMethod = placanje;
  }

  const [
    orders,
    allOrders,
    uniqueUsers,
    pendingInquiriesCount,
    failedOutboxCount,
  ] = await Promise.all([
    canViewProjects
      ? prisma.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, email: true } },
            items: {
              select: { productLabel: true, categoryLabel: true },
              take: 1,
            },
            _count: { select: { files: true, comments: true } },
          },
        })
      : Promise.resolve([]),
    canViewProjects
      ? prisma.order.findMany({
          select: { status: true, totalRsd: true, paymentStatus: true },
        })
      : Promise.resolve([]),
    canViewUsers || canViewProjects
      ? prisma.user.count({ where: { orders: { some: {} } } })
      : Promise.resolve(0),
    canManageInquiries
      ? prisma.projectInquiry.count({ where: { status: "pending" } })
      : Promise.resolve(0),
    canManageSystem
      ? prisma.outboxEvent.count({ where: { status: "failed" } })
      : Promise.resolve(0),
  ]);

  // Stats from all orders (not filtered)
  const totalRevenue = allOrders
    .filter((o) => o.paymentStatus === "completed")
    .reduce((sum, o) => sum + o.totalRsd, 0);

  const activeCount = allOrders.filter((o) =>
    ["paid", "in_progress", "in_review", "revision_requested"].includes(o.status),
  ).length;

  const completedCount = allOrders.filter((o) =>
    ["delivered", "closed"].includes(o.status),
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-foreground">
            Upravljanje platformom
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sve porudžbine, klijenti i statistika na jednom mestu.
          </p>
        </div>
        <nav className="flex items-center gap-2 text-xs">
          {canViewUsers && <AdminNavLink href="/portal/admin/korisnici">Korisnici</AdminNavLink>}
          {canManageInquiries && (
            <AdminNavLink href="/portal/admin/upiti" count={pendingInquiriesCount}>
              Upiti
            </AdminNavLink>
          )}
          {canManageInquiries && <AdminNavLink href="/portal/admin/vr-upiti">VR upiti</AdminNavLink>}
          {adminHas(admin, "USAGE_VIEW") && (
            <AdminNavLink href="/portal/admin/ai-studio">AI Studio</AdminNavLink>
          )}
          {canViewAnalytics && <AdminNavLink href="/portal/admin/analitika">Analitika</AdminNavLink>}
          {canManagePricing && <AdminNavLink href="/portal/admin/finansije/cenovnik">Finansije</AdminNavLink>}
          {canViewFinance && <AdminNavLink href="/portal/admin/finansije/izvoz">Izvoz računa</AdminNavLink>}
          {canViewAudit && <AdminNavLink href="/portal/admin/revizije">Revizije</AdminNavLink>}
          {canManageSystem && (
            <AdminNavLink
              href="/portal/admin/outbox"
              count={failedOutboxCount}
              urgent
            >
              Outbox
            </AdminNavLink>
          )}
        </nav>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {canViewFinance && (
          <div className="rounded-2xl border border-border/40 bg-card/80 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  {formatRsd(totalRevenue)}
                </p>
                <p className="text-[0.72rem] text-muted-foreground">Ukupan prihod</p>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-border/40 bg-card/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 text-muted-foreground">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{allOrders.length}</p>
              <p className="text-[0.72rem] text-muted-foreground">Ukupno porudžbina</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{activeCount}</p>
              <p className="text-[0.72rem] text-muted-foreground">Aktivni projekti</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-sage)]/10 text-[color:var(--color-sage-deep)]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{completedCount}</p>
              <p className="text-[0.72rem] text-muted-foreground">Završeni</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 text-muted-foreground">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{uniqueUsers}</p>
              <p className="text-[0.72rem] text-muted-foreground">Klijenata</p>
            </div>
          </div>
        </div>
      </div>

      {canViewProjects && <AdminFilterBar />}

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {orders.length} rezultat{orders.length === 1 ? "" : "a"}
        {(status || q || usluga || placanje) && " za izabrane filtere"}
      </p>

      {/* Orders table */}
      <div className="space-y-1.5">
        <div className="hidden grid-cols-[1.5fr_1.5fr_1fr_0.8fr_auto_auto_auto] gap-3 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
          <span>Naručilac</span>
          <span>Projekat / usluga</span>
          <span>Datum</span>
          <span>Status</span>
          <span className="w-16 text-center">Poruke</span>
          <span className="w-20 text-right">Iznos</span>
          <span className="w-16">Akcija</span>
        </div>

        {!canViewProjects && (
          <div className="rounded-xl border border-border/30 bg-card/60 px-6 py-8 text-center text-sm text-muted-foreground">
            Vaša rola nema pristup projektnim porudžbinama.
          </div>
        )}

        {canViewProjects && orders.length === 0 && (
          <div className="rounded-xl border border-border/30 bg-card/60 px-6 py-8 text-center text-sm text-muted-foreground">
            Nema porudžbina za izabrane filtere.
          </div>
        )}

        {orders.map((order) => {
          const firstItem = order.items[0];
          return (
            <Link
              key={order.id}
              href={`/portal/admin/porudzbine/${order.id}`}
              className="block rounded-xl border border-border/30 bg-card/80 px-4 py-3 transition-all hover:border-border hover:shadow-[0_4px_16px_rgba(28,26,25,0.04)] lg:grid lg:grid-cols-[1.5fr_1.5fr_1fr_0.8fr_auto_auto_auto] lg:items-center lg:gap-3"
            >
              {/* Client */}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {order.user.name ?? "—"}
                </p>
                <p className="text-[0.72rem] text-muted-foreground">
                  {order.user.email}
                </p>
              </div>

              {/* Project / service */}
              <div className="mt-2 lg:mt-0">
                <p className="text-xs font-medium text-foreground">
                  {order.projectName ?? firstItem?.productLabel ?? "—"}
                </p>
                <p className="text-[0.72rem] text-muted-foreground">
                  {firstItem?.productLabel ?? "—"} · {order.orderNumber}
                </p>
              </div>

              {/* Date */}
              <p className="mt-1 text-xs text-muted-foreground lg:mt-0">
                {order.createdAt.toLocaleDateString("sr-Latn-RS", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>

              {/* Status */}
              <div className="mt-2 lg:mt-0">
                <Badge className={statusAccent(order.status)}>
                  {statusLabel(order.status)}
                </Badge>
              </div>

              {/* Messages */}
              <div className="hidden w-16 text-center lg:block">
                {order._count.comments > 0 ? (
                  <span className="text-xs font-medium text-foreground">
                    {order._count.comments}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/40">—</span>
                )}
              </div>

              {/* Amount */}
              <p className="mt-1 w-20 text-right text-sm font-semibold text-foreground lg:mt-0">
                {canViewFinance ? formatRsd(order.totalRsd) : "—"}
              </p>

              {/* Action */}
              <span className="hidden w-16 text-xs font-medium text-accent lg:block">
                Otvori →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function AdminNavLink({
  href,
  count,
  urgent,
  children,
}: {
  href: string;
  count?: number;
  urgent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/80 px-3 py-1.5 font-medium text-foreground transition-colors hover:border-border"
    >
      {children}
      {count != null && count > 0 && (
        <span
          className={`inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1.5 text-[0.62rem] font-bold text-background ${
            urgent ? "bg-destructive" : "bg-accent"
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
