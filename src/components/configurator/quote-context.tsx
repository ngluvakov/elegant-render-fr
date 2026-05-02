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
  priceItems,
  type QuoteItem,
  type QuoteCalculation,
} from "@/lib/catalog/calculate";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import { newFloor, type InteriorFloor } from "@/lib/catalog/interior-config";
import {
  newTour360Floor,
  defaultTourAssembly,
  type Tour360Config,
} from "@/lib/catalog/tour360-config";
import { track } from "@/lib/posthog-events";
import {
  AI_CREDIT_CATEGORY_ID,
  AI_CREDIT_PRODUCT_ID,
  isAiCreditProduct,
} from "@/lib/ai-studio/catalog";

// ─── Actions ─────────────────────────────────────────────

type QuoteAction =
  | {
      type: "ADD_PRODUCT";
      productId: string;
      categoryId: string;
      sourceMode?: string;
    }
  | { type: "SET_AI_CREDITS"; credits: number }
  | { type: "REMOVE_PRODUCT"; instanceId: string }
  | { type: "SET_ADDON_QTY"; instanceId: string; addOnId: string; qty: number }
  | { type: "SET_DURATION"; instanceId: string; seconds: number }
  | { type: "SET_SOURCE_MODE"; instanceId: string; sourceMode: string }
  | {
      type: "SET_INTERIOR_CONFIG";
      instanceId: string;
      floors: InteriorFloor[];
    }
  | {
      type: "SET_TOUR360_CONFIG";
      instanceId: string;
      config: Tour360Config;
    }
  | { type: "CLEAR_ALL" }
  | { type: "LOAD_ITEMS"; items: QuoteItem[] };

// ─── Reducer ─────────────────────────────────────────────

function quoteReducer(state: QuoteItem[], action: QuoteAction): QuoteItem[] {
  switch (action.type) {
    case "ADD_PRODUCT": {
      const result = getConfiguratorProduct(action.productId);
      if (!result) return state;
      // Inquiry-only products (currently VR) bypass the cart entirely —
      // they route to a consultation intake page instead. Any attempt to
      // add one here is a routing bug; refuse silently.
      if (result.product.inquiryOnly) return state;
      const { product } = result;
      const defaultQuantities: Record<string, number> = {};
      for (const ao of product.addOns) {
        defaultQuantities[ao.id] = ao.includedQty;
      }
      // int-static and int-360 are priced via per-floor configJson on the
      // server (calcInteriorTotal / calcTour360Total) rather than catalog
      // add-ons. Initialize the matching client-side config so /cene's
      // priceItems() routes pricing through the same canonical helpers
      // and the math matches what the portal will use post-checkout.
      const interiorConfig: InteriorFloor[] | undefined =
        action.productId === "int-static" ? [newFloor(0)] : undefined;
      const tour360Config: Tour360Config | undefined =
        action.productId === "int-360"
          ? {
              floors: [newTour360Floor(0)],
              tourAssembly: defaultTourAssembly(),
            }
          : undefined;
      return [
        ...state,
        {
          instanceId: crypto.randomUUID(),
          productId: action.productId,
          categoryId: action.categoryId,
          addOnQuantities: defaultQuantities,
          durationSeconds: product.durationConfig?.defaultSeconds,
          ...(action.sourceMode ? { sourceMode: action.sourceMode } : {}),
          ...(interiorConfig ? { interiorConfig } : {}),
          ...(tour360Config ? { tour360Config } : {}),
        },
      ];
    }
    case "SET_AI_CREDITS": {
      const credits = Math.max(0, Math.floor(action.credits));
      const withoutCredits = state.filter(
        (item) => !isAiCreditProduct(item.productId),
      );
      if (credits === 0) return withoutCredits;
      const existing = state.find((item) => isAiCreditProduct(item.productId));
      return [
        ...withoutCredits,
        {
          instanceId: existing?.instanceId ?? crypto.randomUUID(),
          productId: AI_CREDIT_PRODUCT_ID,
          categoryId: AI_CREDIT_CATEGORY_ID,
          addOnQuantities: {},
          aiCreditQuantity: credits,
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
    case "SET_SOURCE_MODE":
      return state.map((item) =>
        item.instanceId === action.instanceId
          ? { ...item, sourceMode: action.sourceMode }
          : item,
      );
    case "SET_INTERIOR_CONFIG":
      return state.map((item) =>
        item.instanceId === action.instanceId
          ? { ...item, interiorConfig: action.floors }
          : item,
      );
    case "SET_TOUR360_CONFIG":
      return state.map((item) =>
        item.instanceId === action.instanceId
          ? { ...item, tour360Config: action.config }
          : item,
      );
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
  addProduct: (
    productId: string,
    categoryId: string,
    sourceMode?: string,
  ) => void;
  removeProduct: (instanceId: string) => void;
  setAddOnQty: (instanceId: string, addOnId: string, qty: number) => void;
  setDuration: (instanceId: string, seconds: number) => void;
  setSourceMode: (instanceId: string, sourceMode: string) => void;
  setInteriorConfig: (instanceId: string, floors: InteriorFloor[]) => void;
  setTour360Config: (instanceId: string, config: Tour360Config) => void;
  clearAll: () => void;
  loadItems: (items: QuoteItem[]) => void;
  setAiCredits: (credits: number) => void;
};

const QuoteContext = createContext<QuoteContextValue | null>(null);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(quoteReducer, []);
  const calculation = useMemo(() => priceItems(items), [items]);

  const addProduct = useCallback(
    (productId: string, categoryId: string, sourceMode?: string) => {
      const lookup = getConfiguratorProduct(productId);
      if (!lookup || lookup.product.inquiryOnly) return;
      const wasEmpty = items.length === 0;
      dispatch({ type: "ADD_PRODUCT", productId, categoryId, sourceMode });
      if (wasEmpty) {
        track("quote_started", { product_id: productId, category_id: categoryId });
      }
      track("service_added", {
        product_id: productId,
        category_id: categoryId,
        cart_size_after: items.length + 1,
        ...(sourceMode ? { source_mode: sourceMode } : {}),
      });
    },
    [items],
  );
  const removeProduct = useCallback(
    (instanceId: string) => {
      dispatch({ type: "REMOVE_PRODUCT", instanceId });
      const removed = items.find((i) => i.instanceId === instanceId);
      if (removed) {
        track("service_removed", {
          product_id: removed.productId,
          cart_size_after: Math.max(0, items.length - 1),
        });
      }
    },
    [items],
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
  const setSourceMode = useCallback(
    (instanceId: string, sourceMode: string) =>
      dispatch({ type: "SET_SOURCE_MODE", instanceId, sourceMode }),
    [],
  );
  const setInteriorConfig = useCallback(
    (instanceId: string, floors: InteriorFloor[]) =>
      dispatch({ type: "SET_INTERIOR_CONFIG", instanceId, floors }),
    [],
  );
  const setTour360Config = useCallback(
    (instanceId: string, config: Tour360Config) =>
      dispatch({ type: "SET_TOUR360_CONFIG", instanceId, config }),
    [],
  );
  const clearAll = useCallback(() => dispatch({ type: "CLEAR_ALL" }), []);
  const loadItems = useCallback(
    (loaded: QuoteItem[]) => dispatch({ type: "LOAD_ITEMS", items: loaded }),
    [],
  );
  const setAiCredits = useCallback(
    (credits: number) => dispatch({ type: "SET_AI_CREDITS", credits }),
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
      setSourceMode,
      setInteriorConfig,
      setTour360Config,
      clearAll,
      loadItems,
      setAiCredits,
    }),
    [
      items,
      calculation,
      addProduct,
      removeProduct,
      setAddOnQty,
      setDuration,
      setSourceMode,
      setInteriorConfig,
      setTour360Config,
      clearAll,
      loadItems,
      setAiCredits,
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
