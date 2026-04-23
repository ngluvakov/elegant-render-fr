/**
 * ReferenceOrderPicker — Portal draft-detail picker that lets the client
 * link a prior paid order so its model assets feed the cross-service
 * discount resolver (spec Rule 3).
 *
 * Server fetches the user's prior paid/active orders and passes them in.
 * Client calls setOrderReference; page revalidates and the engine reprices.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Link2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { setOrderReference } from "@/server/actions/order";

export type ReferencableOrder = {
  id: string;
  orderNumber: string;
  projectName: string | null;
  status: string;
};

export function ReferenceOrderPicker({
  orderId,
  initialReferenceId,
  availableOrders,
}: {
  orderId: string;
  initialReferenceId: string | null;
  availableOrders: ReferencableOrder[];
}) {
  const [open, setOpen] = useState(false);
  const [refId, setRefId] = useState<string | null>(initialReferenceId);
  const [pending, start] = useTransition();
  const router = useRouter();

  const current = availableOrders.find((o) => o.id === refId);

  const handleSelect = (newRefId: string | null) => {
    start(async () => {
      const res = await setOrderReference(orderId, newRefId);
      if (res.error) {
        alert(res.error);
        return;
      }
      setRefId(newRefId);
      setOpen(false);
      router.refresh();
    });
  };

  if (availableOrders.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-accent" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Prethodni projekat
            </p>
            <p className="mt-0.5 text-[0.72rem] text-muted-foreground">
              {current
                ? "Reusing model-first discounts from referenced order"
                : "Ako imate prethodnu porudžbinu kod nas, povežite je i dobijate popuste na usluge koje dele model."}
            </p>
          </div>
        </div>
        {current ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-[color:var(--color-sage)]/15 px-2.5 py-1 text-[0.72rem] font-semibold text-[color:var(--color-sage-deep)]">
              <Check className="h-3 w-3" />
              {current.projectName ?? current.orderNumber}
            </span>
            <button
              type="button"
              onClick={() => handleSelect(null)}
              disabled={pending}
              aria-label="Ukloni referencu"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:border-accent hover:bg-accent/15"
          >
            <Link2 className="h-3 w-3" />
            Poveži prethodni projekat
          </button>
        )}
      </div>

      {open && !current && (
        <div className="mt-4 space-y-1 border-t border-border/30 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {availableOrders.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => handleSelect(o.id)}
              disabled={pending}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg border border-border/30 bg-card/80 px-3 py-2 text-left transition-all hover:border-accent/40 hover:bg-accent/[0.03]",
                pending && "opacity-50",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {o.projectName ?? "Porudžbina"}
                </p>
                <p className="text-[0.72rem] text-muted-foreground">
                  {o.orderNumber} · {o.status}
                </p>
              </div>
              <Check className="h-3.5 w-3.5 flex-shrink-0 text-accent/50" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full rounded-lg px-3 py-1.5 text-[0.72rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Otkaži
          </button>
        </div>
      )}
    </div>
  );
}
