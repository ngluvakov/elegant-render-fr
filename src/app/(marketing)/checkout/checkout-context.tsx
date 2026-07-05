"use client";

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
  companyMb: string;
  companyAddress: string;
  companyCountryCode: string;
};

const EMPTY_BUYER_INFO: BuyerInfoState = {
  buyerType: "individual",
  buyerCountryCode: "",
  companyName: "",
  companyTaxId: "",
  companyMb: "",
  companyAddress: "",
  companyCountryCode: "",
};

export type UploadedFile = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
};

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
  uploadedFiles: UploadedFile[];
  paymentComplete: boolean;
  installmentCount: number;
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
  addFile: (file: UploadedFile) => void;
  removeFile: (storagePath: string) => void;
  setPaymentComplete: () => void;
  setInstallmentCount: (count: number) => void;
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
  const [step, setStep] = useState(initialUserId ? 1 : 0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(initialUserId);
  const initiallySignedIn = Boolean(initialUserId);
  const [customerName, setCustomerName] = useState(initialName);
  const [customerEmail, setCustomerEmail] = useState(initialEmail);
  const [customerNote, setCustomerNote] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [paymentComplete, setPaymentCompleteState] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(1);
  const [buyerInfo, setBuyerInfoState] =
    useState<BuyerInfoState>(initialBuyerInfo ?? EMPTY_BUYER_INFO);

  const calculation = useMemo(
    () => priceItems(initialItems, [], pricingCatalog),
    [initialItems, pricingCatalog],
  );

  const effectiveDisplayCurrency = useMemo<DisplayCurrency>(() => {
    void buyerInfo.buyerCountryCode;
    void buyerInfo.buyerType;
    void buyerInfo.companyCountryCode;
    void displayCurrency;
    return "rsd";
  }, [
    buyerInfo.buyerCountryCode,
    buyerInfo.buyerType,
    buyerInfo.companyCountryCode,
    displayCurrency,
  ]);

  const setCustomer = useCallback((name: string, email: string) => {
    setCustomerName(name);
    setCustomerEmail(email);
  }, []);

  const addFile = useCallback((file: UploadedFile) => {
    setUploadedFiles((prev) => [...prev, file]);
  }, []);

  const removeFile = useCallback((storagePath: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.storagePath !== storagePath));
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
      uploadedFiles,
      paymentComplete,
      installmentCount,
      buyerInfo,
      displayCurrency: effectiveDisplayCurrency,
      pricingCatalog,
      setStep,
      setCustomer,
      setCustomerNote,
      setOrderId,
      setUserId,
      addFile,
      removeFile,
      setPaymentComplete: () => setPaymentCompleteState(true),
      setInstallmentCount,
      setBuyerInfo,
    }),
    [
      step, initialItems, calculation, orderId, userId, initiallySignedIn,
      customerName, customerEmail, customerNote,
      uploadedFiles, paymentComplete, installmentCount, buyerInfo,
      effectiveDisplayCurrency, pricingCatalog,
      setCustomer, addFile, removeFile, setBuyerInfo,
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
