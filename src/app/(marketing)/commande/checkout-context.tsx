"use client";

/**
 * checkout-context.tsx — state for the 2-step checkout wizard
 * (details → payment) plus the post-payment success screen.
 *
 * Upload state is gone: source files are uploaded after payment via
 * the self-contained <OrderFileUpload> component. The display currency
 * comes from the server (geo) and matches the charge snapshot that
 * createOrder locks server-side.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  priceItems,
  type QuoteItem,
  type QuoteCalculation,
} from "@/lib/catalog/calculate";
import type { ResolvedPricingCatalog } from "@/lib/pricing/catalog";
import type { BuyerType } from "@/lib/buyer-validation";
import type { DisplayCurrency } from "@/lib/catalog/display-currency";

export type BuyerInfoState = {
  buyerType: BuyerType;
  buyerCountryCode: string;
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
  companyCountryCode: string;
};

const EMPTY_BUYER_INFO: BuyerInfoState = {
  buyerType: "individual",
  buyerCountryCode: "",
  companyName: "",
  companyTaxId: "",
  companyAddress: "",
  companyCountryCode: "",
};

export type PaymentState = "idle" | "processing" | "completed";

export type CheckoutState = {
  step: number;
  quoteItems: QuoteItem[];
  calculation: QuoteCalculation;
  orderId: string | null;
  userId: string | null;
  initiallySignedIn: boolean;
  customerName: string;
  customerEmail: string;
  customerNote: string;
  paymentState: PaymentState;
  buyerInfo: BuyerInfoState;
  displayCurrency: DisplayCurrency;
  pricingCatalog?: ResolvedPricingCatalog;
};

type CheckoutContextValue = CheckoutState & {
  setStep: (step: number) => void;
  setCustomer: (name: string, email: string) => void;
  setCustomerNote: (note: string) => void;
  setOrderId: (id: string) => void;
  setUserId: (id: string) => void;
  setPaymentComplete: () => void;
  setPaymentProcessing: () => void;
  setBuyerInfo: (next: BuyerInfoState) => void;
};

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({
  initialItems,
  initialUserId,
  initialName,
  initialEmail,
  children,
  pricingCatalog,
  displayCurrency,
  initialBuyerInfo,
}: {
  initialItems: QuoteItem[];
  initialUserId: string | null;
  initialName: string;
  initialEmail: string;
  pricingCatalog?: ResolvedPricingCatalog;
  displayCurrency: DisplayCurrency;
  initialBuyerInfo?: BuyerInfoState;
  children: ReactNode;
}) {
  const [step, setStep] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(initialUserId);
  const initiallySignedIn = Boolean(initialUserId);
  const [customerName, setCustomerName] = useState(initialName);
  const [customerEmail, setCustomerEmail] = useState(initialEmail);
  const [customerNote, setCustomerNote] = useState("");
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [buyerInfo, setBuyerInfoState] =
    useState<BuyerInfoState>(initialBuyerInfo ?? EMPTY_BUYER_INFO);

  const calculation = useMemo(
    () => priceItems(initialItems, [], pricingCatalog),
    [initialItems, pricingCatalog],
  );

  const setCustomer = useCallback((name: string, email: string) => {
    setCustomerName(name);
    setCustomerEmail(email);
  }, []);

  const setBuyerInfo = useCallback((next: BuyerInfoState) => {
    setBuyerInfoState(next);
  }, []);

  const value = useMemo<CheckoutContextValue>(
    () => ({
      step,
      quoteItems: initialItems,
      calculation,
      orderId,
      userId,
      initiallySignedIn,
      customerName,
      customerEmail,
      customerNote,
      paymentState,
      buyerInfo,
      displayCurrency,
      pricingCatalog,
      setStep,
      setCustomer,
      setCustomerNote,
      setOrderId,
      setUserId,
      setPaymentComplete: () => setPaymentState("completed"),
      setPaymentProcessing: () => setPaymentState("processing"),
      setBuyerInfo,
    }),
    [
      step, initialItems, calculation, orderId, userId, initiallySignedIn,
      customerName, customerEmail, customerNote,
      paymentState, buyerInfo, displayCurrency, pricingCatalog,
      setCustomer, setBuyerInfo,
    ],
  );

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout must be used within CheckoutProvider");
  return ctx;
}
