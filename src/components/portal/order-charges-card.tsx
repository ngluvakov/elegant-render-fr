/**
 * OrderChargesCard — Customer-facing list of additional charges on an
 * order. Pending charges expose payment buttons; paid/cancelled appear
 * as history. Renders nothing if there are no charges.
 */
import { Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatEur } from "@/lib/catalog/calculate";
import { ChargePaymentCard } from "./charge-payment-card";

export type ChargeView = {
  id: string;
  reason: string | null;
  totalCents: number;
  status: "pending" | "paid" | "cancelled";
  paidAt: Date | null;
  createdAt: Date;
  items: Array<{
    id: string;
    label: string;
    amountCents: number;
    quantity: number;
  }>;
};

function statusLabel(status: ChargeView["status"]): string {
  if (status === "pending") return "Čeka uplatu";
  if (status === "paid") return "Plaćeno";
  return "Otkazano";
}

function statusAccent(status: ChargeView["status"]): string {
  if (status === "pending") return "bg-accent/15 text-accent";
  if (status === "paid")
    return "bg-[color:var(--color-sage)]/20 text-[color:var(--color-sage-deep)]";
  return "bg-muted text-muted-foreground";
}

export function OrderChargesCard({ charges }: { charges: ChargeView[] }) {
  if (charges.length === 0) return null;

  const pending = charges.filter((c) => c.status === "pending");
  const history = charges.filter((c) => c.status !== "pending");

  return (
    <section className="rounded-2xl border border-accent/20 bg-accent/[0.04] p-5">
      <div className="flex items-center gap-1.5">
        <Receipt className="h-3.5 w-3.5 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">
          Dodatne naplate
        </h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Stavke van prvobitnog scope-a porudžbine. Plaćanje je dostupno kroz iste
        opcije kao i prvobitna porudžbina.
      </p>

      <div className="mt-4 space-y-4">
        {pending.map((charge) => (
          <div key={charge.id} className="space-y-3 rounded-xl border border-border/40 bg-background/80 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Badge className={statusAccent(charge.status)}>
                  {statusLabel(charge.status)}
                </Badge>
                {charge.reason && (
                  <p className="mt-1.5 text-xs italic text-muted-foreground">
                    {charge.reason}
                  </p>
                )}
              </div>
              <p className="text-base font-bold text-foreground">
                {formatEur(charge.totalCents / 100)}
              </p>
            </div>
            <ul className="space-y-0.5 text-xs text-foreground/80">
              {charge.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {item.label}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                  </span>
                  <span className="font-medium">
                    {formatEur((item.amountCents * item.quantity) / 100)}
                  </span>
                </li>
              ))}
            </ul>
            <ChargePaymentCard
              chargeId={charge.id}
              totalCents={charge.totalCents}
            />
          </div>
        ))}

        {history.length > 0 && (
          <div className="space-y-2">
            {pending.length > 0 && (
              <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Istorija
              </p>
            )}
            {history.map((charge) => (
              <div
                key={charge.id}
                className="rounded-xl border border-border/30 bg-background/60 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Badge className={statusAccent(charge.status)}>
                      {statusLabel(charge.status)}
                    </Badge>
                    <p className="mt-1 text-[0.68rem] text-muted-foreground">
                      {(charge.paidAt ?? charge.createdAt).toLocaleDateString(
                        "sr-Latn-RS",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </p>
                    {charge.reason && (
                      <p className="mt-1 text-xs italic text-muted-foreground line-clamp-2">
                        {charge.reason}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatEur(charge.totalCents / 100)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
