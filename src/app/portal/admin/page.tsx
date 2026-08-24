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
import { formatEur } from "@/lib/catalog/calculate";
import { statusLabel, statusAccent } from "@/components/portal/status-utils";
import { AdminFilterBar } from "./admin-filter-bar";
import { adminHas, requireAnyAdminPagePermission } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin — Gestion de la plateforme",
  description:
    "Vue d’ensemble opérationnelle des commandes, des utilisateurs, des statuts et des tâches de gestion de la plateforme.",
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
  const admin = await requireAnyAdminPagePermission();
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
          select: { status: true, totalEur: true, paymentStatus: true },
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
    .reduce((sum, o) => sum + o.totalEur, 0);

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
            Gestion de la plateforme
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Toutes les commandes, les clients et les statistiques au même endroit.
          </p>
        </div>
        <nav className="flex items-center gap-2 text-xs">
          {canViewUsers && <AdminNavLink href="/portal/admin/users">Utilisateurs</AdminNavLink>}
          {canManageInquiries && (
            <AdminNavLink href="/portal/admin/inquiries" count={pendingInquiriesCount}>
              Demandes
            </AdminNavLink>
          )}
          {canManageInquiries && <AdminNavLink href="/portal/admin/vr-inquiries">Demandes VR</AdminNavLink>}
          {adminHas(admin, "USAGE_VIEW") && (
            <AdminNavLink href="/portal/admin/ai-studio">AI Studio</AdminNavLink>
          )}
          {canViewAnalytics && <AdminNavLink href="/portal/admin/analytics">Statistiques</AdminNavLink>}
          {canManagePricing && <AdminNavLink href="/portal/admin/finance/pricebook">Finance</AdminNavLink>}
          {canViewFinance && <AdminNavLink href="/portal/admin/finance/export">Export de factures</AdminNavLink>}
          {canViewAudit && <AdminNavLink href="/portal/admin/revisions">Journal d’audit</AdminNavLink>}
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
          <div className="rounded-lg border border-border/40 bg-card/80 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  {formatEur(totalRevenue)}
                </p>
                <p className="text-[0.72rem] text-muted-foreground">Chiffre d’affaires</p>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-lg border border-border/40 bg-card/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 text-muted-foreground">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{allOrders.length}</p>
              <p className="text-[0.72rem] text-muted-foreground">Total des commandes</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-card/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{activeCount}</p>
              <p className="text-[0.72rem] text-muted-foreground">Projets actifs</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-card/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-foreground">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{completedCount}</p>
              <p className="text-[0.72rem] text-muted-foreground">Terminés</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-card/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 text-muted-foreground">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{uniqueUsers}</p>
              <p className="text-[0.72rem] text-muted-foreground">Clients</p>
            </div>
          </div>
        </div>
      </div>

      {canViewProjects && <AdminFilterBar />}

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {orders.length} {orders.length === 1 ? "résultat" : "résultats"}
        {(status || q || usluga || placanje) && " pour les filtres sélectionnés"}
      </p>

      {/* Orders table */}
      <div className="space-y-1.5">
        <div className="hidden grid-cols-[1.5fr_1.5fr_1fr_0.8fr_auto_auto_auto] gap-3 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
          <span>Client</span>
          <span>Projet / service</span>
          <span>Date</span>
          <span>Statut</span>
          <span className="w-16 text-center">Messages</span>
          <span className="w-20 text-right">Montant</span>
          <span className="w-16">Action</span>
        </div>

        {!canViewProjects && (
          <div className="rounded-xl border border-border/30 bg-card/60 px-6 py-8 text-center text-sm text-muted-foreground">
            Votre rôle n’a pas accès aux commandes de projets.
          </div>
        )}

        {canViewProjects && orders.length === 0 && (
          <div className="rounded-xl border border-border/30 bg-card/60 px-6 py-8 text-center text-sm text-muted-foreground">
            Aucune commande ne correspond aux filtres sélectionnés.
          </div>
        )}

        {orders.map((order) => {
          const firstItem = order.items[0];
          return (
            <Link
              key={order.id}
              href={`/portal/admin/orders/${order.id}`}
              className="block rounded-xl border border-border/30 bg-card/80 px-4 py-3 transition-all hover:border-border hover: lg:grid lg:grid-cols-[1.5fr_1.5fr_1fr_0.8fr_auto_auto_auto] lg:items-center lg:gap-3"
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
                {order.createdAt.toLocaleDateString("fr-FR", {
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
                {canViewFinance ? formatEur(order.totalEur) : "—"}
              </p>

              {/* Action */}
              <span className="hidden w-16 text-xs font-medium text-accent lg:block">
                Ouvrir →
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
