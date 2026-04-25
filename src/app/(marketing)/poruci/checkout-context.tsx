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
  calculateQuote,
  type QuoteItem,
  type QuoteCalculation,
} from "@/lib/catalog/calculate";

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
};

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({
  initialItems,
  initialUserId,
  initialName,
  initialEmail,
  children,
}: {
  initialItems: QuoteItem[];
  initialUserId: string | null;
  initialName: string;
  initialEmail: string;
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

  const calculation = useMemo(
    () => calculateQuote(initialItems),
    [initialItems],
  );

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
      setStep,
      setCustomer,
      setCustomerNote,
      setOrderId,
      setUserId,
      addFile,
      removeFile,
      setPaymentComplete: () => setPaymentCompleteState(true),
    }),
    [
      step, initialItems, calculation, orderId, userId, initiallySignedIn,
      customerName, customerEmail, customerNote,
      uploadedFiles, paymentComplete,
      setCustomer, addFile, removeFile,
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
