/**
 * OrderCurrencyContext — Per-order display currency for the portal.
 *
 * The portal stores RSD amounts in the DB (integer cents on OrderItem)
 * and renders every order in RSD to match /cene and /poruci.
 * pricingSettings carries Serbia VAT rate used when displaying and splitting
 * RSD gross amounts.
 *
 * Wrap the order detail subtree in <OrderCurrencyProvider> and read with
 * useOrderCurrency() inside client components. Server children receive
 * the same values as props.
 */
"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  formatPublicDiscountedPrice,
  formatPublicPrice,
  formatPublicPriceText,
  type DisplayCurrency,
  type PublicDiscountedPriceParts,
  type PublicPricingFormatSettings,
} from "@/lib/catalog/display-currency";

type OrderCurrencyValue = {
  currency: DisplayCurrency;
  settings: PublicPricingFormatSettings;
  formatPrice: (amountRsd: number) => string;
  formatPriceText: (text: string) => string;
  formatDiscounted: (
    totalRsd: number,
    originalTotalRsd: number,
    pct: number,
  ) => PublicDiscountedPriceParts;
};

const OrderCurrencyContext = createContext<OrderCurrencyValue | null>(null);

export function OrderCurrencyProvider({
  currency,
  settings,
  children,
}: {
  currency: DisplayCurrency;
  settings: PublicPricingFormatSettings;
  children: ReactNode;
}) {
  const value = useMemo<OrderCurrencyValue>(
    () => ({
      currency,
      settings,
      formatPrice: (amountRsd) =>
        formatPublicPrice(amountRsd, currency, settings),
      formatPriceText: (text) =>
        formatPublicPriceText(text, currency, settings),
      formatDiscounted: (totalRsd, originalTotalRsd, pct) =>
        formatPublicDiscountedPrice(
          totalRsd,
          originalTotalRsd,
          pct,
          currency,
          settings,
        ),
    }),
    [currency, settings],
  );

  return (
    <OrderCurrencyContext.Provider value={value}>
      {children}
    </OrderCurrencyContext.Provider>
  );
}

export function useOrderCurrency(): OrderCurrencyValue {
  const value = useContext(OrderCurrencyContext);
  if (!value) {
    throw new Error(
      "useOrderCurrency must be used inside <OrderCurrencyProvider>",
    );
  }
  return value;
}
