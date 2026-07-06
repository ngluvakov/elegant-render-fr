/**
 * OrderOverviewCard — Clickable project card for the dashboard, displaying
 * order number, first item, status badge, total, and last update date.
 *
 * Used on: /portal (dashboard page).
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatEur } from "@/lib/catalog/calculate";
import { formatBillingMoney, type BillingCurrency } from "@/lib/billing";
import { statusLabel, statusAccent } from "./status-utils";

type OrderOverviewCardProps = {
  order: {
    id: string;
    orderNumber: string;
    projectName: string | null;
    status: string;
    totalEur: number;
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
  const title = order.projectName ?? firstItem?.productLabel ?? "Order";
  const total = order.billingCurrency && order.billingTotalCents != null
    ? formatBillingMoney(order.billingTotalCents, order.billingCurrency)
    : formatEur((order.totalCents ?? order.totalEur * 100) / 100);

  return (
    <Link
      href={`/portal/orders/${order.id}`}
      className="group block rounded-lg border border-border/40 bg-card/80 p-5 transition-all hover:border-border hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)]"
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
              {order.items.length > 1 &&
                ` + ${order.items.length - 1} ${order.items.length - 1 === 1 ? "item" : "items"}`}
            </p>
          )}
        </div>
        <Badge className={accent}>{statusLabel(order.status)}</Badge>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{total}</span>
          <span>
            {order.updatedAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
          Open <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
