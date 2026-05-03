"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { DisplayCurrency } from "@/lib/catalog/display-currency";

const PublicCurrencyContext = createContext<DisplayCurrency>("eur");

export function PublicCurrencyProvider({
  children,
  displayCurrency,
}: {
  children: ReactNode;
  displayCurrency: DisplayCurrency;
}) {
  return (
    <PublicCurrencyContext.Provider value={displayCurrency}>
      {children}
    </PublicCurrencyContext.Provider>
  );
}

export function usePublicCurrency() {
  return useContext(PublicCurrencyContext);
}
