const FALLBACK_EUR_TO_RSD_RATE = 117.2;
const FALLBACK_SERBIA_VAT_RATE = 0.2;

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

export function eurToPublicRsd(amountEur: number): number {
  return Math.round(
    amountEur * PUBLIC_EUR_TO_RSD_RATE * (1 + PUBLIC_SERBIA_VAT_RATE),
  );
}

export function formatPublicPrice(amountEur: number): string {
  return `${rsdFormatter.format(eurToPublicRsd(amountEur))} RSD`;
}

export function formatPublicPriceFromCents(cents: number): string {
  return formatPublicPrice(cents / 100);
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
): PublicDiscountedPriceParts {
  if (pct <= 0 || totalEur >= originalTotalEur) {
    return { primary: formatPublicPrice(totalEur), struck: null, badge: null };
  }
  return {
    primary: formatPublicPrice(totalEur),
    struck: formatPublicPrice(originalTotalEur),
    badge: `-${pct}%`,
  };
}

export function formatPublicPriceText(text: string): string {
  return text.replace(/€\s?(\d+(?:[.,]\d+)?)/g, (_, rawAmount: string) => {
    const amount = Number.parseFloat(rawAmount.replace(",", "."));
    if (!Number.isFinite(amount)) return _;
    return formatPublicPrice(amount);
  });
}
