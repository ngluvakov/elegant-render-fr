import type { QuoteItem } from "@/lib/catalog/calculate";

export const CHECKOUT_QUOTE_STORAGE_KEY = "er-checkout-quote";
export const CHECKOUT_WITHDRAWAL_WAIVER_STORAGE_KEY =
  "er-checkout-withdrawal-waived-at";

export function stashCheckoutQuote(
  items: QuoteItem[],
  options?: { withdrawalWaivedAt?: Date },
) {
  sessionStorage.setItem(CHECKOUT_QUOTE_STORAGE_KEY, JSON.stringify(items));

  if (options?.withdrawalWaivedAt) {
    sessionStorage.setItem(
      CHECKOUT_WITHDRAWAL_WAIVER_STORAGE_KEY,
      options.withdrawalWaivedAt.toISOString(),
    );
    return;
  }

  sessionStorage.removeItem(CHECKOUT_WITHDRAWAL_WAIVER_STORAGE_KEY);
}

export function readCheckoutWithdrawalWaiver(): Date | null {
  const raw = sessionStorage.getItem(CHECKOUT_WITHDRAWAL_WAIVER_STORAGE_KEY);
  if (!raw) return null;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    sessionStorage.removeItem(CHECKOUT_WITHDRAWAL_WAIVER_STORAGE_KEY);
    return null;
  }

  return parsed;
}

export function clearCheckoutSession() {
  sessionStorage.removeItem(CHECKOUT_QUOTE_STORAGE_KEY);
  sessionStorage.removeItem(CHECKOUT_WITHDRAWAL_WAIVER_STORAGE_KEY);
}
