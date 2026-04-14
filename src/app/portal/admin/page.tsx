import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatEur } from "@/lib/catalog/calculate";
import { statusLabel, statusAccent } from "@/components/portal/status-utils";

export const metadata: Metadata = {
  title: "Admin — Sve porudžbine",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const [orders, stats] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { productLabel: true, categoryLabel: true }, take: 1 },
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "completed")
    .reduce((sum, o) => sum + o.totalEur, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-foreground">
          Admin panel
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {orders.length} porudžbin{orders.length === 1 ? "a" : "a"} · {formatEur(totalRevenue)} prihoda
        </p>
      </div>

      {/* Status breakdown */}
      <div className="flex flex-wrap gap-2">
        {stats.map((s) => (
          <div
            key={s.status}
            className="rounded-lg border border-border/40 bg-card/80 px-3 py-2 text-xs"
          >
            <span className="text-muted-foreground">{statusLabel(s.status)}:</span>{" "}
            <span className="font-semibold text-foreground">{s._count}</span>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto_auto] gap-3 px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Klijent</span>
          <span>Projekat</span>
          <span>Datum</span>
          <span>Status</span>
          <span className="w-20 text-right">Iznos</span>
          <span className="w-16">Akcija</span>
        </div>

        {orders.map((order) => {
          const firstItem = order.items[0];
          return (
            <div
              key={order.id}
              className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto_auto] items-center gap-3 rounded-xl border border-border/30 bg-card/80 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {order.user.name ?? "—"}
                </p>
                <p className="text-[0.6rem] text-muted-foreground">
                  {order.user.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground">
                  {firstItem?.productLabel ?? "—"}
                </p>
                <p className="text-[0.6rem] text-muted-foreground">
                  {order.orderNumber}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {order.createdAt.toLocaleDateString("sr-Latn-RS", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
              <Badge className={statusAccent(order.status)}>
                {statusLabel(order.status)}
              </Badge>
              <p className="w-20 text-right text-sm font-semibold text-foreground">
                {formatEur(order.totalEur)}
              </p>
              <Link
                href={`/portal/admin/porudzbine/${order.id}`}
                className="w-16 text-xs font-medium text-accent hover:underline"
              >
                Otvori
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
