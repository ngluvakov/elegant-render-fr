/**
 * DeleteOrderButton — Confirm + delete a draft/cancelled order.
 * Small icon-only trigger with inline confirm state.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteDraftOrder } from "@/server/actions/order";

export function DeleteOrderButton({
  orderId,
  orderNumber,
  className,
}: {
  orderId: string;
  orderNumber: string;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    start(async () => {
      const result = await deleteDraftOrder(orderId);
      if (result.error) {
        alert(result.error);
        setConfirming(false);
        return;
      }
      router.refresh();
    });
  };

  if (!confirming) {
    return (
      <button
        type="button"
        aria-label={`Obriši nacrt ${orderNumber}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirming(true);
        }}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 transition-all hover:bg-destructive/10 hover:text-destructive",
          className,
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md bg-destructive/10 p-0.5 text-destructive animate-in fade-in slide-in-from-right-1 duration-150",
        className,
      )}
    >
      <span className="px-1.5 text-[0.6rem] font-semibold">Obrisati?</span>
      <button
        type="button"
        aria-label="Potvrdi brisanje"
        disabled={pending}
        onClick={handleDelete}
        className="inline-flex h-6 w-6 items-center justify-center rounded-sm transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
      >
        <Check className="h-3 w-3" />
      </button>
      <button
        type="button"
        aria-label="Otkaži"
        onClick={() => setConfirming(false)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
