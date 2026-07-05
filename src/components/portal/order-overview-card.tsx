/**
 * OrderOverviewCard — Clickable project card for the dashboard, displaying
 * order number, first item, status badge, total, and last update date.
 *
 * Used on: /portal (dashboard page).
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRsd } from "@/lib/catalog/calculate";
import { formatBillingMoney, type BillingCurrency } from "@/lib/billing";
import { statusLabel, statusAccent } from "./status-utils";

type OrderOverviewCardProps = {
  order: {
    id: string;
    orderNumber: string;
    projectName: string | null;
    status: string;
    totalRsd: number;
    totalCents: number | null;
    billingCurrency: BillingCurrency | null;
    billingTotalCents: number | null;
    createdAt: Date;
    updatedAt: Date;
    customerNote: string | null;
    items: Array<{ productLabel: string; categoryLabel: string }>;
  };
};

export function OrderOverviewCard({ order }: OrderOverviewCardProps) {
  const firstItem = order.items[0];
  const accent = statusAccent(order.status);
  const title = order.projectName ?? firstItem?.productLabel ?? "Porudžbina";
  const total = order.billingCurrency && order.billingTotalCents != null
    ? formatBillingMoney(order.billingTotalCents, order.billingCurrency)
    : formatRsd((order.totalCents ?? order.totalRsd * 100) / 100);

  return (
    <Link
      href={`/portal/orders/${order.id}`}
      className="group block rounded-2xl border border-border/40 bg-card/80 p-5 transition-all hover:border-border hover:shadow-[0_14px_40px_rgba(28,26,25,0.05)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {order.orderNumber}
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            {title}
          </h3>
          {firstItem && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {firstItem.productLabel} · {firstItem.categoryLabel}
              {order.items.length > 1 && ` + ${order.items.length - 1} stavk${order.items.length - 1 === 1 ? "a" : "i"}`}
            </p>
          )}
        </div>
        <Badge className={accent}>{statusLabel(order.status)}</Badge>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{total}</span>
          <span>
            {order.updatedAt.toLocaleDateString("sr-Latn-RS", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
          Otvori <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
