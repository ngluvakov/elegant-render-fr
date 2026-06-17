const FALLBACK_SERBIA_VAT_RATE = 0.2;

export type DisplayCurrency = "rsd";
export type PublicPricingFormatSettings = {
  rsdRate: number;
  serbiaVatRate: number;
};

function readPublicNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const PUBLIC_RSD_RATE = 1;

export const PUBLIC_SERBIA_VAT_RATE = readPublicNumber(
  "NEXT_PUBLIC_SERBIA_VAT_RATE",
  FALLBACK_SERBIA_VAT_RATE,
);

const rsdFormatter = new Intl.NumberFormat("sr-RS", {
  maximumFractionDigits: 0,
});

export function getDisplayCurrencyForCountry(
  _countryCode: string | null | undefined,
): DisplayCurrency {
  void _countryCode;
  return "rsd";
}

export function formatAsPublicRsd(
  amountRsd: number,
  _settings?: PublicPricingFormatSettings,
): number {
  void _settings;
  return Math.round(amountRsd);
}

export function formatPublicRsdAmount(amountRsd: number): string {
  return `${rsdFormatter.format(formatAsPublicRsd(amountRsd))} RSD`;
}

export function formatPublicPrice(
  amountRsd: number,
  _currency: DisplayCurrency = "rsd",
  _settings?: PublicPricingFormatSettings,
): string {
  void _currency;
  void _settings;
  return formatPublicRsdAmount(amountRsd);
}

export function formatPublicPriceFromCents(
  cents: number,
  currency: DisplayCurrency = "rsd",
  settings?: PublicPricingFormatSettings,
): string {
  return formatPublicPrice(cents / 100, currency, settings);
}

export type PublicDiscountedPriceParts = {
  primary: string;
  struck: string | null;
  badge: string | null;
};

export type PublicPricingTerms = {
  title: string;
  badge: string;
  lead: string;
  bullets: string[];
  ctaLabel: string;
  shortNote: string;
};

export function formatPublicDiscountedPrice(
  totalRsd: number,
  originalTotalRsd: number,
  pct: number,
  currency: DisplayCurrency = "rsd",
  settings?: PublicPricingFormatSettings,
): PublicDiscountedPriceParts {
  if (pct <= 0 || totalRsd >= originalTotalRsd) {
    return {
      primary: formatPublicPrice(totalRsd, currency, settings),
      struck: null,
      badge: null,
    };
  }
  return {
    primary: formatPublicPrice(totalRsd, currency, settings),
    struck: formatPublicPrice(originalTotalRsd, currency, settings),
    badge: `-${pct}%`,
  };
}

export function formatPublicPriceText(
  text: string,
  currency: DisplayCurrency = "rsd",
  settings?: PublicPricingFormatSettings,
): string {
  return text.replace(
    /RSD\s?(\d+(?:[.,]\d+)?)(?:\s?[–-]\s?(?:RSD)?\s?(\d+(?:[.,]\d+)?))?/g,
    (match, rawAmount: string, rawRangeEnd?: string) => {
      const amount = Number.parseFloat(rawAmount.replace(",", "."));
      if (!Number.isFinite(amount)) return match;
      const formattedStart = formatPublicPrice(amount, currency, settings);
      if (!rawRangeEnd) return formattedStart;
      const rangeEnd = Number.parseFloat(rawRangeEnd.replace(",", "."));
      if (!Number.isFinite(rangeEnd)) return formattedStart;
      return `${formattedStart}-${formatPublicPrice(rangeEnd, currency, settings)}`;
    },
  );
}

const sharedCommercialTerms = [
  "Svaki projekat uključuje tri kruga revizija bez dodatne naknade.",
  "Ako kadar zahteva dodatnu geometriju koja nije vidljiva iz primarnog pogleda, primenjuje se jednokratna doplata od +25% na izradu modela; nakon toga svi kadrovi idu po standardnoj ceni.",
  "Za veće projekte i stambene komplekse koristimo progresivne popuste. Javite nam se i spremićemo ponudu po meri.",
];

export function getPublicPricingTerms(
  _currency: DisplayCurrency = "rsd",
): PublicPricingTerms {
  void _currency;
  return {
    title: "Napomene za cene",
    badge: "RSD, PDV uračunat",
    lead: "Sve javne i checkout cene prikazane su u dinarima.",
    bullets: [
      "Cene su prikazane u RSD kao bruto iznosi sa uračunatim PDV-om.",
      "Konačna ponuda, predračun i račun koriste isti RSD iznos za domaće i strane kupce.",
      "Zemlja kupca služi za identitet/adresu i podatke na računu, ne za promenu valute.",
      ...sharedCommercialTerms,
    ],
    ctaLabel: "Zatražite ponudu",
    shortNote: "Sve cene su u RSD kao bruto iznosi sa uračunatim PDV-om.",
  };
}

export function publicPriceNote(currency: DisplayCurrency = "rsd"): string {
  return getPublicPricingTerms(currency).shortNote;
}
