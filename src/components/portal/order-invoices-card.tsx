/**
 * OrderInvoicesCard — Sidebar block on the project detail page that lists
 * every issued document for the order: proforma, order invoice,
 * and a row per OrderCharge invoice. Replaces the old single-invoice card.
 */
import { Download, ReceiptText } from "lucide-react";
import { formatBillingMoney } from "@/lib/billing";
import { buildInvoiceList } from "@/lib/invoice-list";

type OrderProp = Parameters<typeof buildInvoiceList>[0];
type ChargeProp = Parameters<typeof buildInvoiceList>[1][number];

export function OrderInvoicesCard({
  order,
  charges,
}: {
  order: OrderProp;
  charges: ChargeProp[];
}) {
  const invoices = buildInvoiceList(order, charges);

  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/60 p-5 md:p-6">
        <div className="flex items-center gap-1.5">
          <ReceiptText className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Invoices</h3>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          No issued invoices. The invoice is issued after payment.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-5 md:p-6">
      <div className="flex items-center gap-1.5">
        <ReceiptText className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Invoices</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {invoices.map((inv) => (
          <li
            key={inv.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-border/30 bg-card p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{inv.label}</p>
              <p className="mt-0.5 font-mono text-[0.72rem] text-muted-foreground">
                {inv.number}
              </p>
              <p className="text-[0.72rem] text-muted-foreground">
                issued {formatDate(inv.issuedAt)}
                {inv.amountCents !== null && inv.currency
                  ? ` · ${formatBillingMoney(inv.amountCents, inv.currency)}`
                  : ""}
              </p>
            </div>
            <a
              href={inv.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Download ${inv.label} ${inv.number}`}
              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-background transition hover:opacity-90"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
