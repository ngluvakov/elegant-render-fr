"use client";

import { Popover } from "@base-ui/react/popover";
import { ChevronDown, Download, FileText } from "lucide-react";
import { formatBillingMoney } from "@/lib/billing";
import type { InvoiceDoc } from "@/lib/invoice-list";

type CellStatus = "completed" | "pending" | "failed" | "refunded" | "partial";

export function FinanceInvoicesCell({
  invoices,
  status,
}: {
  invoices: InvoiceDoc[];
  status: CellStatus;
}) {
  if (invoices.length === 0) {
    return (
      <span className="text-[0.78rem] text-muted-foreground">
        {status === "completed" ? "Invoice is being prepared" : "After payment"}
      </span>
    );
  }

  if (invoices.length === 1) {
    const inv = invoices[0];
    return (
      <a
        href={inv.href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[0.78rem] font-medium text-background transition hover:opacity-90"
      >
        <Download className="h-3.5 w-3.5" />
        {inv.kind === "proforma" ? "Proforma" : "Invoice"}
      </a>
    );
  }

  return (
    <Popover.Root>
      <Popover.Trigger className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[0.78rem] font-medium text-foreground transition hover:bg-secondary">
        <FileText className="h-3.5 w-3.5" />
        {invoices.length} documents
        <ChevronDown className="h-3 w-3" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="end">
          <Popover.Popup className="z-50 min-w-[300px] rounded-xl border border-border/40 bg-popover p-1.5 text-popover-foreground shadow-lg outline-none">
            {invoices.map((inv) => (
              <a
                key={inv.id}
                href={inv.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-start justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-secondary/70"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {inv.label}
                  </p>
                  <p className="mt-0.5 text-[0.72rem] text-muted-foreground">
                    <span className="font-mono">{inv.number}</span>
                    {" · "}
                    {formatDate(inv.issuedAt)}
                    {inv.amountCents !== null && inv.currency
                      ? ` · ${formatBillingMoney(inv.amountCents, inv.currency)}`
                      : ""}
                  </p>
                </div>
                <Download className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              </a>
            ))}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
