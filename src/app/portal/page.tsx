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
    description: `Status promenjen → ${statusLabel(e.toStatus)}`,
    createdAt: e.createdAt,
  }));

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground md:text-4xl">
            Dobrodošli, {user?.name?.split(" ")[0] || "korisniče"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount > 0
              ? `${activeCount} aktivn${activeCount === 1 ? "i" : "ih"} projek${activeCount === 1 ? "at" : "ata"}`
              : "Nemate aktivnih projekata"}
          </p>
        </div>
        <Link
          href="/cene"
          className={cn(
            buttonVariants({ variant: "accent", size: "default" }),
            "shrink-0",
          )}
        >
          <Plus className="h-4 w-4" />
          Nova porudžbina
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStatCard
          icon={Briefcase}
          label="Aktivni projekti"
          value={activeCount}
        />
        <SummaryStatCard
          icon={AlertCircle}
          label="Treba pažnju"
          value={needsAttentionCount}
          accent="clay"
        />
        <SummaryStatCard
          icon={MessageSquare}
          label="Nove poruke"
          value={0}
        />
        <SummaryStatCard
          icon={Download}
          label="Spremno za preuzimanje"
          value={deliveredCount}
          accent="sage"
        />
      </div>

      {/* Active orders */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Aktivni projekti
        </h2>
        {activeOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            heading="Nemate aktivnih projekata"
            description="Posetite cenovnik da napravite prvu porudžbinu."
            action={{ label: "Pogledajte cene", href: "/cene" }}
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
          Nedavna aktivnost
        </h2>
        <ActivityFeed events={activityEvents} />
      </section>
    </div>
  );
}
