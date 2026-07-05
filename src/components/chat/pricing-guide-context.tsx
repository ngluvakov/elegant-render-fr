/**
 * PricingAssistantGuideContext — injects the live cenovnik cart into the
 * assistant guide store so both the contextual tip bubble and the AI can
 * recognize what the user is configuring on /pricing and advise on the purchase.
 *
 * Null-render; must be mounted inside <QuoteProvider> so useQuote() works.
 * Mirrors the OrderAssistantGuideContext pattern.
 *
 * Used on: (marketing)/pricing/page.tsx
 */
"use client";

import { useAssistantGuideContext } from "@/lib/chat/guide-context";
import { isAiCreditProduct } from "@/lib/ai-studio/catalog";
import { useQuote } from "@/components/configurator/quote-context";

export function PricingAssistantGuideContext() {
  const { items, calculation } = useQuote();

  // Render products only — the AI-credit pseudo-product is not a render
  // configuration and shouldn't drive "what to add to your model" advice.
  const productIds = items
    .map((item) => item.productId)
    .filter((id) => !isAiCreditProduct(id));

  useAssistantGuideContext({
    page: "pricing",
    stage: "pricing_review",
    productIds,
    // Total line count (incl. credits) — matches MobileQuoteBar visibility,
    // used for the bottom-bar lift and the AI's cart summary.
    cartItemCount: calculation.items.length,
    cartTotalRsd: calculation.total,
    cartOriginalTotalRsd: calculation.originalTotal,
    cartHasDiscount: calculation.originalTotal > calculation.total,
  });

  return null;
}
