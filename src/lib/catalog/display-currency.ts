const FALLBACK_EUR_TO_RSD_RATE = 117.2;
const FALLBACK_SERBIA_VAT_RATE = 0.2;

export type DisplayCurrency = "rsd" | "eur";

function readPublicNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const PUBLIC_EUR_TO_RSD_RATE = readPublicNumber(
  "NEXT_PUBLIC_EUR_TO_RSD_RATE",
  FALLBACK_EUR_TO_RSD_RATE,
);

export const PUBLIC_SERBIA_VAT_RATE = readPublicNumber(
  "NEXT_PUBLIC_SERBIA_VAT_RATE",
  FALLBACK_SERBIA_VAT_RATE,
);

const rsdFormatter = new Intl.NumberFormat("sr-RS", {
  maximumFractionDigits: 0,
});

const eurFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function getDisplayCurrencyForCountry(
  countryCode: string | null | undefined,
): DisplayCurrency {
  return countryCode?.toUpperCase() === "RS" ? "rsd" : "eur";
}

export function eurToPublicRsd(amountEur: number): number {
  return Math.round(
    amountEur * PUBLIC_EUR_TO_RSD_RATE * (1 + PUBLIC_SERBIA_VAT_RATE),
  );
}

export function formatPublicPrice(
  amountEur: number,
  currency: DisplayCurrency = "eur",
): string {
  if (currency === "eur") {
    return eurFormatter.format(amountEur);
  }
  return `${rsdFormatter.format(eurToPublicRsd(amountEur))} RSD`;
}

export function formatPublicPriceFromCents(
  cents: number,
  currency: DisplayCurrency = "eur",
): string {
  return formatPublicPrice(cents / 100, currency);
}

export type PublicDiscountedPriceParts = {
  primary: string;
  struck: string | null;
  badge: string | null;
};

export function formatPublicDiscountedPrice(
  totalEur: number,
  originalTotalEur: number,
  pct: number,
  currency: DisplayCurrency = "eur",
): PublicDiscountedPriceParts {
  if (pct <= 0 || totalEur >= originalTotalEur) {
    return {
      primary: formatPublicPrice(totalEur, currency),
      struck: null,
      badge: null,
    };
  }
  return {
    primary: formatPublicPrice(totalEur, currency),
    struck: formatPublicPrice(originalTotalEur, currency),
    badge: `-${pct}%`,
  };
}

export function formatPublicPriceText(
  text: string,
  currency: DisplayCurrency = "eur",
): string {
  return text.replace(/€\s?(\d+(?:[.,]\d+)?)/g, (_, rawAmount: string) => {
    const amount = Number.parseFloat(rawAmount.replace(",", "."));
    if (!Number.isFinite(amount)) return _;
    return formatPublicPrice(amount, currency);
  });
}

export function publicPriceNote(currency: DisplayCurrency): string {
  return currency === "rsd"
    ? "Sve cene su prikazane u dinarima (RSD), sa uračunatim PDV-om."
    : "Sve cene su prikazane u evrima (EUR), bez PDV-a.";
}
