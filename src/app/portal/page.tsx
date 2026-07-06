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
  title: "Portal",
  description:
    "Overview of active projects, orders, activity, and deliverables in the customer portal.",
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
    description: `Status changed to ${statusLabel(e.toStatus)}`,
    createdAt: e.createdAt,
  }));

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground md:text-4xl">
            Welcome, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount > 0
              ? `${activeCount} active project${activeCount === 1 ? "" : "s"}`
              : "You have no active projects"}
          </p>
        </div>
        <Link
          href="/pricing"
          className={cn(
            buttonVariants({ variant: "accent", size: "default" }),
            "shrink-0",
          )}
        >
          <Plus className="h-4 w-4" />
          New order
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStatCard
          icon={Briefcase}
          label="Active projects"
          value={activeCount}
        />
        <SummaryStatCard
          icon={AlertCircle}
          label="Needs attention"
          value={needsAttentionCount}
          accent="clay"
        />
        <SummaryStatCard
          icon={MessageSquare}
          label="New messages"
          value={0}
        />
        <SummaryStatCard
          icon={Download}
          label="Ready to download"
          value={deliveredCount}
          accent="sage"
        />
      </div>

      {/* Active orders */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Active projects
        </h2>
        {activeOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            heading="You have no active projects"
            description="Visit pricing to create your first order."
            action={{ label: "View pricing", href: "/pricing" }}
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
          Recent activity
        </h2>
        <ActivityFeed events={activityEvents} />
      </section>
    </div>
  );
}
