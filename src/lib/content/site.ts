/**
 * site.ts — Site-wide content constants (branding, navigation, copy).
 *
 * Exports SITE, NAV_MAIN, NAV_LEGAL, TRUST_SIGNALS, PLATFORM_PRINCIPLES,
 * ORDERING_STEPS, FAQ_ITEMS — all static English-language content for the
 * international (elegantrender.com) deployment.
 *
 * Copy source of truth: docs/design-handoff/README.md (final English copy,
 * verbatim) and docs/copy-glossary.md for everything else.
 *
 * Used by: layout.tsx, site-header, site-footer, marketing pages,
 *          legal pages, robots.ts, sitemap.ts
 */
import { SITE_FEATURES } from "@/lib/site-features";

// Canonical site URL used by absoluteUrl(), robots.ts, sitemap.ts,
// and the JSON-LD Organization schema below. Env-driven with a
// fallback so the production build always resolves a real URL even
// if NEXT_PUBLIC_SITE_URL isn't set. Setting the env var explicitly
// is useful for non-prod environments (preview branches that should
// look at a different host) without touching code.
const DEFAULT_SITE_URL = "https://elegantrender.com";

function normalizeSiteUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

const RESOLVED_SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
);

export const SITE = {
  name: "Elegant Render",
  longName: "Elegant Render Platform",
  parentCompany: "White Rook DOO",
  tagline: "A beautiful image, a clear price, an easier decision.",
  description:
    "Hand-crafted renders, virtual staging and visual makeovers for homes and properties — with prices you can see up front. A beautiful image, a clear price, an easier decision.",
  url: RESOLVED_SITE_URL,
  email: "info@elegantrender.com",
  instagram: "https://www.instagram.com/elegantrender",
} as const;

/**
 * Legal identity of the operating company — used on /legal/imprint, in
 * the footer and in the JSON-LD Organization schema. Values come from the
 * Serbian business registry (APR, https://pretraga.apr.gov.rs). Phone and
 * legal-representative name are optional — the e-commerce disclosure rules
 * require the registered name, seat, registry numbers and a means of quick,
 * direct contact — email satisfies the last requirement.
 */
export const IMPRINT = {
  // Title case for display. APR registers in all-caps as a typesetting
  // convention; capitalization is not part of the legal identity. Use
  // shortName ("White Rook DOO") on customer-facing surfaces and reserve
  // legalName for legal pages where the formal registered identity is
  // surfaced (imprint, privacy controller block, terms provider block).
  legalName:
    "Društvo za grafički dizajn, proizvodnju, trgovinu i usluge, White Rook DOO Kovačica",
  shortName: "White Rook DOO",
  street: "JNA 25",
  postalCode: "26210",
  city: "Kovačica",
  country: "Serbia",
  taxId: "110339214", // PIB (tax ID)
  registryNumber: "21339393", // MB (company registry number)
  activityCode: "7410", // Specialized design activities
  foundedAt: "2017-11-22",
  size: "Small enterprise",
  email: "info@elegantrender.com",
  privacyEmail: "info@elegantrender.com",
  euRepresentative: null as null | {
    name: string;
    address: string;
    email: string;
  },
  // Bank account info that lands on proforma invoice PDFs as the
  // payment instruction. Currently a placeholder — fill in real
  // values when wire-transfer flow goes live (you can leave any
  // single field empty and the PDF will skip its row).
  // PayPal-only billing (owner decision 2026-07-07): no wire-transfer
  // account. Populate these only if a wire-transfer offer flow is ever
  // activated — proforma PDFs skip every empty row.
  bank: {
    name: "",
    iban: "",
    swift: "",
    accountNumber: "",
  },
} as const;

export function formatAddress(): string {
  return `${IMPRINT.street}, ${IMPRINT.postalCode} ${IMPRINT.city}, ${IMPRINT.country}`;
}

export const TRUST_SIGNALS = [
  "No packages outside the price list — every price comes straight from the official price list.",
  "You know exactly what you pay and what you get — no hidden costs, no fine print.",
  "Three revision rounds are included in every project, so the final result matches your vision.",
  "Certified by TÜV Rheinland — ISO 9001:2015, ISO/IEC 27001:2022, ISO 50001:2018.",
] as const;

export type IsoCertification = {
  id: "iso-9001" | "iso-27001" | "iso-50001";
  code: string;
  domain: string;
  description: string;
  certNumber?: string;
  verifyUrl?: string;
};

export const CERTIFIER = {
  name: "TÜV Rheinland",
  fullName: "TÜV Rheinland — German certification body",
  description:
    "TÜV Rheinland is one of the world's oldest and most respected certification bodies, headquartered in Cologne and present in over 50 countries. Its certificates are considered an industry reference and require regular independent audits — not a one-off declaration, but a continuously maintained system.",
  // Combined Testmark badge issued for all three standards under a single ID.
  // Source: hi-res CMYK PNG/PDF from TÜV's certification package, converted
  // to sRGB WebP for web (1600px wide, ~65KB).
  badgeAsset: {
    src: "/legal/tuv-rheinland-certified.webp",
    pdfSrc: "/legal/tuv-rheinland-certified.pdf",
    width: 1600,
    height: 590,
    alt: "TÜV Rheinland CERTIFIED — ISO 9001:2015, ISO/IEC 27001:2022, ISO 50001:2018, ID 9000025319",
  },
} as const;

const TUV_RHEINLAND_CERT_ID = "9000025319";
// Certipedia is TÜV Rheinland's public certificate registry. The URL on
// the badge QR code resolves here for all three standards (combined cert).
const TUV_RHEINLAND_VERIFY_URL = `https://www.certipedia.com/quality_marks/${TUV_RHEINLAND_CERT_ID}?locale=en`;

export const ISO_CERTIFICATIONS: IsoCertification[] = [
  {
    id: "iso-9001",
    code: "ISO 9001:2015",
    domain: "Quality management",
    description:
      "The standard that defines requirements for a quality management system across processes and service delivery. Our workflow — from receiving materials, through revisions, to delivering final renders — is aligned with this standard, which means predictable quality and a consistent result on every project.",
    certNumber: TUV_RHEINLAND_CERT_ID,
    verifyUrl: TUV_RHEINLAND_VERIFY_URL,
  },
  {
    id: "iso-27001",
    code: "ISO/IEC 27001:2022",
    domain: "Information security",
    description:
      "The standard for information security management. Your files (floor plans, photos and personal data in the portal) are handled under certified procedures: controlled access, encryption in transit, defined retention and incident response processes. This standard is also the basis of our GDPR compliance.",
    certNumber: TUV_RHEINLAND_CERT_ID,
    verifyUrl: TUV_RHEINLAND_VERIFY_URL,
  },
  {
    id: "iso-50001",
    code: "ISO 50001:2018",
    domain: "Energy management",
    description:
      "The standard for systematic energy-efficiency management. Our render capacity and internal infrastructure track and optimize energy consumption, reducing the environmental footprint of digital architectural production.",
    certNumber: TUV_RHEINLAND_CERT_ID,
    verifyUrl: TUV_RHEINLAND_VERIFY_URL,
  },
];

/**
 * The four ordering-process steps — copy per the design handoff Process
 * section (final English, verbatim). Rendered on the homepage Process
 * section and in the HowTo JSON-LD.
 */
export const PLATFORM_PRINCIPLES = [
  {
    title: "1. Get your estimate",
    text: "Pick a service and see the starting price immediately — and exactly what it includes.",
  },
  {
    title: "2. Send your materials",
    text: "The form asks only for what we need to start: floor plans, photos, style references and a short goal.",
  },
  {
    title: "3. Receive first drafts",
    text: "For standard projects, first drafts arrive in 3–5 working days, with clear communication through the portal.",
  },
  {
    title: "4. Finalize through revisions",
    text: "Three revision rounds are included. Then you download the final files and project documentation.",
  },
] as const;

export type NavItem = { href: string; label: string };

export const NAV_MAIN: NavItem[] = [
  { href: "/ai-studio", label: "AI Studio" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  ...(SITE_FEATURES.portfolio
    ? [{ href: "/portfolio", label: "Portfolio" }]
    : []),
  { href: "/about", label: "About us" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const STRUCTURED_DATA_DESCRIPTION =
  "Professional architectural visualization — 3D interior and exterior renders, virtual staging and virtual renovation.";

export const NAV_LEGAL: NavItem[] = [
  { href: "/legal", label: "Legal information" },
  { href: "/legal/imprint", label: "Imprint" },
  { href: "/legal/terms", label: "Terms of service" },
  { href: "/legal/privacy", label: "Privacy policy" },
  { href: "/legal/cookies", label: "Cookie policy" },
  { href: "/legal/withdrawal#online-withdrawal", label: "Withdraw from a contract" },
  { href: "/legal/refunds", label: "Refunds policy" },
  { href: "/legal/complaints", label: "Complaints procedure" },
  { href: "/legal/delivery", label: "Digital delivery" },
  { href: "/legal/certificates", label: "Certificates and standards" },
];

// Four concrete model-first savings examples — copy per the design handoff
// "Model-first pricing" section (final English, verbatim). The ModelFirst
// component renders this list as the 2×2 card grid next to the dark panel.
export const ORDERING_STEPS = [
  {
    step: "01",
    title: "A new camera angle",
    description:
      "Exteriors start at €250 including the full 3D model. Each additional angle of the same building costs 81% less.",
  },
  {
    step: "02",
    title: "More floors",
    description:
      "The first interior floor covers up to 10 rooms. Every further floor in the same building gets an automatic 30% discount.",
  },
  {
    step: "03",
    title: "Animation",
    description:
      "If we already built the model on a previous project, the per-second animation price drops by 33%.",
  },
  {
    step: "04",
    title: "Residential buildings",
    description:
      "For developers: the first apartment type is full price, and every further type gets a progressive discount of up to 44%.",
  },
] as const;

/** Alias kept for legacy imports in /contact and other places. */
export const HOW_IT_WORKS = ORDERING_STEPS;

export const FAQ_ITEMS = [
  {
    question: "How long does one render take?",
    answer:
      "For standard projects — say, a single-room interior — first drafts arrive within 3 to 5 working days. For larger projects you get an exact timeline with the quote, before any work starts.",
  },
  {
    question: "Does the price include revisions?",
    answer:
      "Yes. While the industry standard is 1–2 rounds, we include 3 revision rounds in the base price. We want you fully happy with the result.",
  },
  {
    question: "What materials should I send you?",
    answer:
      "Floor plans (2D or PDF), photos of the current state, and style or mood references are the most useful. The order form lets you upload everything at once.",
  },
  {
    question: "Do you issue invoices and work under contract?",
    answer:
      "Yes. Elegant Render is part of White Rook DOO and operates under EU-compatible invoicing. Every project comes with proper documentation.",
  },
  {
    question: "What if my project is bigger than usual?",
    answer:
      "For residential buildings and large development projects we apply progressive discounts — for example on repeated apartment types. Send us an inquiry and you'll get a precise calculation.",
  },
] as const;

export const SERVICES_PAGE_FAQS = [
  {
    question: "How do I know which service I need?",
    answer:
      "Send us photos, a floor plan or a short description of your goal. Based on that we suggest the most logical service and a price range.",
  },
  {
    question: "Are the prices final?",
    answer:
      "The page shows starting prices. The final price depends on scope, number of views, level of detail and input materials.",
  },
  {
    question: "How many revision rounds are included?",
    answer:
      "Three revision rounds are included in the base price of every service, unless the scope of the project changes.",
  },
  {
    question: "Do you only work locally?",
    answer:
      "Elegant Render delivers across Europe and beyond. The entire process — from estimate to final files — runs online through your project portal.",
  },
] as const;

export const AI_STUDIO_FAQS = [
  {
    question: "Does AI Studio produce a 3D render?",
    answer:
      "No. AI Studio edits existing photographs. If the space doesn't exist yet or you need a fully controlled architectural view, a classic render is the better choice.",
  },
  {
    question: "When should I use a mask?",
    answer:
      "Use a mask when you want the edit to affect only part of the image: a larger object, a specific wall, part of the floor or one zone of the room.",
  },
  {
    question: "What is the difference between staging, renovation and redesign?",
    answer:
      "Staging adds furniture to an empty space. Renovation changes the materials and elements of the space. Redesign changes the style and atmosphere of an existing room.",
  },
  {
    question: "When do I use furniture/decor insertion or replacement?",
    answer:
      "When you have a photo of the space and separate images of a specific piece of furniture, decor, lighting, plant, artwork or appliance. You can add several angles of the same model/color/material, and for replacement you mark the existing piece with a mask.",
  },
  {
    question: "Can I process a result again?",
    answer:
      "Yes. A result can become the new input image for a small correction or further editing. If you continue the same edit type, the system currently allows one free retry.",
  },
  {
    question: "What if the edit fails?",
    answer:
      "If the system fails to complete the edit, the charged credits are returned to your AI Studio balance. If the result isn't good enough, continue editing from the result and use the available free retry for the same edit type.",
  },
  {
    question: "How long are files available?",
    answer:
      "AI Studio files are stored for 30 days. During that period you can download the result from your history or use it as a new input image.",
  },
  {
    question: "Do I get an invoice for credit purchases?",
    answer:
      "Yes. Elegant Render is part of White Rook DOO and issues proper documentation for credit purchases based on the buyer's details.",
  },
] as const;

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService", "LocalBusiness"],
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    alternateName: SITE.longName,
    legalName: IMPRINT.legalName,
    url: SITE.url,
    logo: `${SITE.url}/branding/elegant-render-logo-with-padding.png`,
    image: `${SITE.url}/og-image.jpg`,
    description: STRUCTURED_DATA_DESCRIPTION,
    email: SITE.email,
    taxID: IMPRINT.taxId,
    vatID: IMPRINT.taxId,
    foundingDate: IMPRINT.foundedAt,
    address: {
      "@type": "PostalAddress",
      streetAddress: IMPRINT.street,
      postalCode: IMPRINT.postalCode,
      addressLocality: IMPRINT.city,
      addressRegion: "RS",
      addressCountry: "RS",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SITE.email,
        availableLanguage: ["en"],
      },
    ],
    sameAs: [SITE.instagram],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        opens: "09:00",
        closes: "17:00",
      },
    ],
    areaServed: ["EU", "GB", "US", "Worldwide"],
    currenciesAccepted: "EUR",
    priceRange: "€€",
    serviceType: [
      "Architectural visualization",
      "3D rendering",
      "Virtual staging",
      "AI real estate photo editing",
    ],
    parentOrganization: {
      "@type": "Organization",
      name: SITE.parentCompany,
    },
    hasCredential: ISO_CERTIFICATIONS.map((cert) => ({
      "@type": "EducationalOccupationalCredential",
      credentialCategory: `${cert.code} (${cert.domain})`,
      recognizedBy: {
        "@type": "Organization",
        name: CERTIFIER.name,
      },
    })),
  };
}
