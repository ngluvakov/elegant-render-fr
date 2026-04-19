import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatEur } from "@/lib/catalog/calculate";
import { statusLabel, statusAccent } from "@/components/portal/status-utils";
import { OrdersFilterBar } from "@/components/portal/orders-filter-bar";
import { EmptyState } from "@/components/portal/empty-state";
import { DeleteOrderButton } from "@/components/portal/delete-order-button";

export const metadata: Metadata = {
  title: "Porudžbine",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ status?: string; q?: string }>;

export default async function PorudzbinePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { status, q } = await searchParams;

  const where: Record<string, unknown> = { userId: session.user.id };
  if (status) where.status = status;
  if (q) where.orderNumber = { contains: q, mode: "insensitive" };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { productLabel: true, categoryLabel: true }, take: 1 },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-foreground md:text-3xl">
            Porudžbine
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {orders.length} porudžbin{orders.length === 1 ? "a" : "a"}
          </p>
        </div>
        <Link
          href="/cene"
          className="group inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-[0_14px_34px_-12px_rgba(159,106,75,0.45)] transition-all hover:bg-accent/90 hover:shadow-[0_18px_40px_-10px_rgba(159,106,75,0.55)]"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          Novi nacrt
        </Link>
      </div>

      <OrdersFilterBar />

      {orders.length === 0 ? (
        <EmptyState
          icon={Search}
          heading="Nema rezultata"
          description="Pokušajte sa drugim filterima ili pretragom."
        />
      ) : (
        <>
          {/* Desktop: soft table */}
          <div className="hidden md:block">
            <div className="space-y-1.5">
              {/* Header row */}
              <div className="grid grid-cols-[2fr_1fr_1fr_auto_auto_auto] gap-4 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Projekat</span>
                <span>Usluga</span>
                <span>Aktivnost</span>
                <span className="w-28 text-center">Status</span>
                <span className="w-20 text-right">Iznos</span>
                <span className="w-8" />
              </div>

              {/* Rows */}
              {orders.map((order) => {
                const firstItem = order.items[0];
                const canDelete =
                  order.status === "draft" || order.status === "cancelled";
                const displayName =
                  order.projectName ??
                  firstItem?.productLabel ??
                  "Porudžbina";
                return (
                  <div
                    key={order.id}
                    className="group relative grid grid-cols-[2fr_1fr_1fr_auto_auto_auto] items-center gap-4 rounded-xl border border-border/30 bg-card/80 px-4 py-3.5 transition-all hover:border-border hover:shadow-[0_4px_16px_rgba(28,26,25,0.04)]"
                  >
                    <Link
                      href={`/portal/porudzbine/${order.id}`}
                      className="absolute inset-0 rounded-xl"
                      aria-label={`Otvori ${order.orderNumber}`}
                    />
                    <div className="relative">
                      <p className="text-sm font-medium text-foreground">
                        {displayName}
                      </p>
                      <p className="text-[0.65rem] text-muted-foreground">
                        {order.orderNumber}
                      </p>
                    </div>
                    <p className="relative text-xs text-muted-foreground">
                      {firstItem?.categoryLabel ?? "—"}
                    </p>
                    <p className="relative text-xs text-muted-foreground">
                      {order.updatedAt.toLocaleDateString("sr-Latn-RS", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <div className="relative w-28 text-center">
                      <Badge className={statusAccent(order.status)}>
                        {statusLabel(order.status)}
                      </Badge>
                    </div>
                    <p className="relative w-20 text-right text-sm font-semibold text-foreground">
                      {formatEur(order.totalEur)}
                    </p>
                    <div className="relative w-8 flex justify-end">
                      {canDelete && (
                        <DeleteOrderButton
                          orderId={order.id}
                          orderNumber={order.orderNumber}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile: card stack */}
          <div className="space-y-3 md:hidden">
            {orders.map((order) => {
              const firstItem = order.items[0];
              const canDelete =
                order.status === "draft" || order.status === "cancelled";
              const displayName =
                order.projectName ??
                firstItem?.productLabel ??
                "Porudžbina";
              return (
                <div
                  key={order.id}
                  className="relative rounded-2xl border border-border/40 bg-card/80 p-4 transition-shadow hover:shadow-[0_8px_24px_rgba(28,26,25,0.05)]"
                >
                  <Link
                    href={`/portal/porudzbine/${order.id}`}
                    className="absolute inset-0 rounded-2xl"
                    aria-label={`Otvori ${order.orderNumber}`}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {displayName}
                      </p>
                      <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                        {order.orderNumber} · {firstItem?.categoryLabel ?? "—"}
                      </p>
                    </div>
                    <Badge className={statusAccent(order.status)}>
                      {statusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="relative mt-3 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {order.updatedAt.toLocaleDateString("sr-Latn-RS", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      {canDelete && (
                        <DeleteOrderButton
                          orderId={order.id}
                          orderNumber={order.orderNumber}
                        />
                      )}
                      <p className="text-sm font-semibold text-foreground">
                        {formatEur(order.totalEur)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
