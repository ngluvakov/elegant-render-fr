/**
 * NewOrderFromQuote — Client component that reads the quote from sessionStorage,
 * creates a draft order via server action, and redirects to the order detail page.
 *
 * Used on: /portal/nova-porudzbina
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { type QuoteItem } from "@/lib/catalog/calculate";
import { createOrder } from "@/server/actions/order";

export function NewOrderFromQuote({ userId }: { userId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const creatingRef = useRef(false);

  useEffect(() => {
    if (creatingRef.current) return;
    creatingRef.current = true;

    const raw = sessionStorage.getItem("er-checkout-quote");

    if (!raw) {
      router.replace("/cene");
      return;
    }

    let items: QuoteItem[];
    try {
      items = JSON.parse(raw);
      if (!items.length) {
        router.replace("/cene");
        return;
      }
    } catch {
      router.replace("/cene");
      return;
    }

    createOrder(userId, items).then((result) => {
      if (result.error) {
        setError(result.error);
        return;
      }

      sessionStorage.removeItem("er-checkout-quote");
      router.replace(`/portal/porudzbine/${result.orderId}`);
    });
  }, [userId, router]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-destructive">{error}</p>
          <button
            onClick={() => router.push("/cene")}
            className="mt-4 text-sm text-accent hover:underline"
          >
            Nazad na cenovnik
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
        <p className="mt-4 text-sm text-muted-foreground">
          Kreiranje porudžbine…
        </p>
      </div>
    </div>
  );
}
