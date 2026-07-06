"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { DisplayCurrency } from "@/lib/catalog/display-currency";
import {
  DEFAULT_PRICING_SETTINGS,
  type PricingSettings,
} from "@/lib/pricing/catalog";

const PublicCurrencyContext = createContext<DisplayCurrency>("EUR");
const PublicPricingSettingsContext = createContext<PricingSettings>(
  DEFAULT_PRICING_SETTINGS,
);

export function PublicCurrencyProvider({
  children,
  displayCurrency,
  pricingSettings = DEFAULT_PRICING_SETTINGS,
}: {
  children: ReactNode;
  displayCurrency: DisplayCurrency;
  pricingSettings?: PricingSettings;
}) {
  return (
    <PublicPricingSettingsContext.Provider value={pricingSettings}>
      <PublicCurrencyContext.Provider value={displayCurrency}>
        {children}
      </PublicCurrencyContext.Provider>
    </PublicPricingSettingsContext.Provider>
  );
}

export function usePublicCurrency() {
  return useContext(PublicCurrencyContext);
}

export function usePublicPricingSettings() {
  return useContext(PublicPricingSettingsContext);
}
