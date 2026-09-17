import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertCircle,
  Briefcase,
  Download,
  MessageSquare,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { SummaryStatCard } from "@/components/portal/summary-stat-card";
import { OrderOverviewCard } from "@/components/portal/order-overview-card";
import { ActivityFeed } from "@/components/portal/activity-feed";
import { EmptyState } from "@/components/portal/empty-state";
import { statusLabel } from "@/components/portal/status-utils";

export const metadata: Metadata = {
  title: "Espace client",
  description:
    "Vue d’ensemble des projets actifs, des commandes, de l’activité et des livrables dans l’espace client.",
  robots: { index: false, follow: false },
};

export default async function PortalPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = session.user;

  // Queries
  const [activeCount, needsAttentionCount, deliveredCount, activeOrders, recentEvents] =
    await Promise.all([
      prisma.order.count({
        where: {
          userId,
          status: { in: ["paid", "in_progress", "in_review", "revision_requested"] },
        },
      }),
      prisma.order.count({
        where: { userId, status: "in_review" },
      }),
      prisma.order.count({
        where: { userId, status: "delivered" },
      }),
      prisma.order.findMany({
        where: {
          userId,
          status: {
            notIn: ["closed", "cancelled", "refunded"],
          },
        },
        include: { items: { select: { productLabel: true, categoryLabel: true } } },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.orderStatusEvent.findMany({
        where: { order: { userId } },
        include: { order: { select: { orderNumber: true, id: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const activityEvents = recentEvents.map((e) => ({
    id: e.id,
    orderNumber: e.order.orderNumber,
    orderId: e.order.id,
    description: `Statut modifié : ${statusLabel(e.toStatus)}`,
    createdAt: e.createdAt,
  }));

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground md:text-4xl">
            Bienvenue{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount > 0
              ? `${activeCount} projet${activeCount === 1 ? "" : "s"} actif${activeCount === 1 ? "" : "s"}`
              : "Vous n’avez aucun projet actif"}
          </p>
        </div>
        <Link
          href="/tarifs"
          className={cn(
            buttonVariants({ variant: "accent", size: "default" }),
            "shrink-0",
          )}
        >
          <Plus className="h-4 w-4" />
          Nouvelle commande
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStatCard
          icon={Briefcase}
          label="Projets actifs"
          value={activeCount}
        />
        <SummaryStatCard
          icon={AlertCircle}
          label="Action requise"
          value={needsAttentionCount}
          accent="clay"
        />
        <SummaryStatCard
          icon={MessageSquare}
          label="Nouveaux messages"
          value={0}
        />
        <SummaryStatCard
          icon={Download}
          label="Prêts à télécharger"
          value={deliveredCount}
          accent="sage"
        />
      </div>

      {/* Active orders */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Projets actifs
        </h2>
        {activeOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            heading="Vous n’avez aucun projet actif"
            description="Consultez les tarifs pour créer votre première commande."
            action={{ label: "Voir les tarifs", href: "/tarifs" }}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {activeOrders.map((order) => (
              <OrderOverviewCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Activité récente
        </h2>
        <ActivityFeed events={activityEvents} />
      </section>
    </div>
  );
}
