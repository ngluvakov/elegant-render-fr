/**
 * QuoteContext — React Context + useReducer for quote/cart state management.
 * Exposes addProduct, removeProduct, setAddOnQty, setDuration, and clearAll actions.
 *
 * Used on: PricingConfigurator (wraps all configurator children).
 */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  calculateQuote,
  type QuoteItem,
  type QuoteCalculation,
} from "@/lib/catalog/calculate";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";

// ─── Actions ─────────────────────────────────────────────

type QuoteAction =
  | { type: "ADD_PRODUCT"; productId: string; categoryId: string }
  | { type: "REMOVE_PRODUCT"; instanceId: string }
  | { type: "SET_ADDON_QTY"; instanceId: string; addOnId: string; qty: number }
  | { type: "SET_DURATION"; instanceId: string; seconds: number }
  | { type: "CLEAR_ALL" }
  | { type: "LOAD_ITEMS"; items: QuoteItem[] };

// ─── Reducer ─────────────────────────────────────────────

function quoteReducer(state: QuoteItem[], action: QuoteAction): QuoteItem[] {
  switch (action.type) {
    case "ADD_PRODUCT": {
      const result = getConfiguratorProduct(action.productId);
      if (!result) return state;
      const { product } = result;
      const defaultQuantities: Record<string, number> = {};
      for (const ao of product.addOns) {
        defaultQuantities[ao.id] = ao.includedQty;
      }
      return [
        ...state,
        {
          instanceId: crypto.randomUUID(),
          productId: action.productId,
          categoryId: action.categoryId,
          addOnQuantities: defaultQuantities,
          durationSeconds: product.durationConfig?.defaultSeconds,
        },
      ];
    }
    case "REMOVE_PRODUCT":
      return state.filter((item) => item.instanceId !== action.instanceId);
    case "SET_ADDON_QTY":
      return state.map((item) => {
        if (item.instanceId !== action.instanceId) return item;
        return {
          ...item,
          addOnQuantities: {
            ...item.addOnQuantities,
            [action.addOnId]: Math.max(0, action.qty),
          },
        };
      });
    case "SET_DURATION":
      return state.map((item) => {
        if (item.instanceId !== action.instanceId) return item;
        const result = getConfiguratorProduct(item.productId);
        const min = result?.product.durationConfig?.minSeconds ?? 15;
        return {
          ...item,
          durationSeconds: Math.max(min, action.seconds),
        };
      });
    case "CLEAR_ALL":
      return [];
    case "LOAD_ITEMS":
      return action.items;
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────

type QuoteContextValue = {
  items: QuoteItem[];
  calculation: QuoteCalculation;
  dispatch: React.Dispatch<QuoteAction>;
  addProduct: (productId: string, categoryId: string) => void;
  removeProduct: (instanceId: string) => void;
  setAddOnQty: (instanceId: string, addOnId: string, qty: number) => void;
  setDuration: (instanceId: string, seconds: number) => void;
  clearAll: () => void;
  loadItems: (items: QuoteItem[]) => void;
};

const QuoteContext = createContext<QuoteContextValue | null>(null);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(quoteReducer, []);
  const calculation = useMemo(() => calculateQuote(items), [items]);

  const addProduct = useCallback(
    (productId: string, categoryId: string) =>
      dispatch({ type: "ADD_PRODUCT", productId, categoryId }),
    [],
  );
  const removeProduct = useCallback(
    (instanceId: string) =>
      dispatch({ type: "REMOVE_PRODUCT", instanceId }),
    [],
  );
  const setAddOnQty = useCallback(
    (instanceId: string, addOnId: string, qty: number) =>
      dispatch({ type: "SET_ADDON_QTY", instanceId, addOnId, qty }),
    [],
  );
  const setDuration = useCallback(
    (instanceId: string, seconds: number) =>
      dispatch({ type: "SET_DURATION", instanceId, seconds }),
    [],
  );
  const clearAll = useCallback(() => dispatch({ type: "CLEAR_ALL" }), []);
  const loadItems = useCallback(
    (loaded: QuoteItem[]) => dispatch({ type: "LOAD_ITEMS", items: loaded }),
    [],
  );

  const value = useMemo<QuoteContextValue>(
    () => ({
      items,
      calculation,
      dispatch,
      addProduct,
      removeProduct,
      setAddOnQty,
      setDuration,
      clearAll,
      loadItems,
    }),
    [
      items,
      calculation,
      addProduct,
      removeProduct,
      setAddOnQty,
      setDuration,
      clearAll,
      loadItems,
    ],
  );

  return (
    <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>
  );
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuote must be used within QuoteProvider");
  return ctx;
}
