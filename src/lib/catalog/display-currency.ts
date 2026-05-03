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

export type PublicPricingTerms = {
  title: string;
  badge: string;
  lead: string;
  bullets: string[];
  ctaLabel: string;
  shortNote: string;
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

const sharedCommercialTerms = [
  "Svaki projekat uključuje tri kruga revizija bez dodatne naknade.",
  "Ako kadar zahteva dodatnu geometriju koja nije vidljiva iz primarnog pogleda, primenjuje se jednokratna doplata od +25% na izradu modela; nakon toga svi kadrovi idu po standardnoj ceni.",
  "Za veće projekte i stambene komplekse koristimo progresivne popuste. Javite nam se i spremićemo ponudu po meri.",
];

export function getPublicPricingTerms(
  currency: DisplayCurrency,
): PublicPricingTerms {
  if (currency === "rsd") {
    return {
      title: "Napomene za Srbiju",
      badge: "Srbija - RSD sa PDV-om",
      lead: "Ovaj prikaz cenovnika je prilagođen klijentima iz Srbije.",
      bullets: [
        "Cene su prikazane u dinarima (RSD), sa uračunatim PDV-om.",
        "RSD iznosi se računaju iz osnovnog EUR cenovnika po podešenom kursu i važećoj PDV stopi.",
        "Konačna ponuda i račun za klijente iz Srbije prate lokalne uslove naplate i oporezivanja.",
        ...sharedCommercialTerms,
      ],
      ctaLabel: "Zatražite ponudu za Srbiju",
      shortNote: "Sve cene su prikazane u RSD, sa uračunatim PDV-om.",
    };
  }

  return {
    title: "Napomene za inostranstvo",
    badge: "Inostranstvo - EUR bez PDV-a",
    lead: "Ovaj prikaz cenovnika je prilagođen klijentima van Srbije.",
    bullets: [
      "Cene su prikazane u evrima (EUR), bez PDV-a.",
      "Lokalni porezi, takse i eventualni troškovi payment providera nisu deo prikazane osnovne cene.",
      "Finalni iznos može zavisiti od zemlje naplate, tipa klijenta i načina plaćanja.",
      ...sharedCommercialTerms,
    ],
    ctaLabel: "Zatražite ponudu za inostranstvo",
    shortNote:
      "Sve cene su prikazane u EUR, bez PDV-a; lokalni porezi ili takse nisu deo prikazane osnovne cene.",
  };
}

export function publicPriceNote(currency: DisplayCurrency): string {
  return getPublicPricingTerms(currency).shortNote;
}
