/**
 * OrderCurrencyContext — Per-order display currency for the portal.
 *
 * The portal stores EUR amounts in the DB (integer cents on OrderItem)
 * but renders them in the buyer's currency (RSD for RS, EUR otherwise)
 * to match how /cene and /poruci present prices. The order's
 * billingCurrency drives the choice; pricingSettings carries the EUR→RSD
 * rate + Serbia VAT rate used when displaying and splitting RSD gross amounts.
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
  formatPrice: (amountEur: number) => string;
  formatPriceText: (text: string) => string;
  formatDiscounted: (
    totalEur: number,
    originalTotalEur: number,
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
      formatPrice: (amountEur) =>
        formatPublicPrice(amountEur, currency, settings),
      formatPriceText: (text) =>
        formatPublicPriceText(text, currency, settings),
      formatDiscounted: (totalEur, originalTotalEur, pct) =>
        formatPublicDiscountedPrice(
          totalEur,
          originalTotalEur,
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
