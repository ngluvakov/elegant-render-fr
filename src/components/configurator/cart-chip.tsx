/**
 * CartChip — Persistent cart indicator in the chip bar.
 *
 * DOM-absent when cart is empty (return null, not hidden).
 * Filters AI credit items from count per Carrington's rule.
 * Scrolls to #korpa section on click.
 */
"use client";

import { useQuote } from "./quote-context";
import { isAiCreditProduct } from "@/lib/ai-studio/catalog";
import { track } from "@/lib/posthog-events";

export function CartChip() {
  const { items } = useQuote();
  const count = items.filter((i) => !isAiCreditProduct(i.productId)).length;

  if (count === 0) return null;

  const handleClick = () => {
    document.getElementById("korpa")?.scrollIntoView({ behavior: "smooth" });
    track("cart_chip_click", { cart_size: count });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="snap-start shrink-0 rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium animate-in fade-in slide-in-from-right-2 duration-150 ease-out"
    >
      Cart ({count}) &rarr;
    </button>
  );
}
