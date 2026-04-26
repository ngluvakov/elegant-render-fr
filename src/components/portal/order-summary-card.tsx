/**
 * OrderSummaryCard — Right-panel summary showing line items with prices,
 * attached source files, and the customer note.
 *
 * Used on: /portal/porudzbine/[orderId] (order detail page).
 */
import { formatDiscountedPrice } from "@/lib/catalog/calculate";

type OrderSummaryCardProps = {
  items: Array<{
    id: string;
    productLabel: string;
    categoryLabel: string;
    totalEur: number;
    totalCents: number | null;
    originalTotalEur: number | null;
    discountPct: number | null;
    discountReason: string | null;
  }>;
  customerNote: string | null;
  sourceFiles: Array<{ id: string; fileName: string; fileSize: number }>;
};

export function OrderSummaryCard({
  items,
  customerNote,
  sourceFiles,
}: OrderSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
      <h3 className="text-sm font-semibold text-foreground">
        Pregled porudžbine
      </h3>

      {/* Items */}
      <div className="mt-4 space-y-2">
        {items.map((item) => {
          const { primary, struck } = formatDiscountedPrice(
            (item.totalCents ?? item.totalEur * 100) / 100,
            item.originalTotalEur ?? item.totalEur,
            item.discountPct ?? 0,
          );
          return (
            <div
              key={item.id}
              className="flex items-center justify-between text-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{item.productLabel}</p>
                <p className="text-[0.72rem] text-muted-foreground">
                  {item.categoryLabel}
                </p>
                {item.discountReason && (
                  <p className="mt-0.5 text-[0.68rem] text-[color:var(--color-sage-deep)]">
                    {item.discountReason}
                  </p>
                )}
              </div>
              <span className="ml-2 text-right font-semibold text-foreground">
                {struck && (
                  <span className="mr-1 text-[0.7rem] font-normal text-muted-foreground/60 line-through">
                    {struck}
                  </span>
                )}
                {primary}
              </span>
            </div>
          );
        })}
      </div>

      {/* Source files */}
      {sourceFiles.length > 0 && (
        <div className="mt-4 border-t border-border/30 pt-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Priloženi materijali ({sourceFiles.length})
          </p>
          <div className="mt-2 space-y-1">
            {sourceFiles.map((f) => (
              <p key={f.id} className="truncate text-[0.72rem] text-muted-foreground">
                {f.fileName}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Customer note */}
      {customerNote && (
        <div className="mt-4 border-t border-border/30 pt-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Napomena
          </p>
          <p className="mt-1 text-xs text-foreground/80">{customerNote}</p>
        </div>
      )}
    </div>
  );
}
