import type {
  ConfiguratorCategory,
  ConfiguratorProduct,
} from "@/lib/catalog/configurator";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";
import { SERVICES } from "@/lib/catalog/services";
import {
  AI_CREDIT_UNITS_PER_CREDIT,
  AI_EDIT_TYPES,
  AI_FILE_RETENTION_DAYS,
  AI_FREE_REGENERATIONS,
} from "@/lib/ai-studio/catalog";
import {
  AI_STUDIO_FAQS,
  FAQ_ITEMS,
  IMPRINT,
  SERVICES_PAGE_FAQS,
  SITE,
} from "@/lib/content/site";

type PublicServiceSummary = {
  slug: string;
  name: string;
  note: string;
};

const SERVICE_SUMMARIES: PublicServiceSummary[] = [
  {
    slug: "interior-renders",
    name: "Interior renders",
    note: "Photoreal interior renders for sales, listings, and design decisions.",
  },
  {
    slug: "exterior-renders",
    name: "Exterior renders",
    note: "Facade, building, and development renders from plans or models.",
  },
  {
    slug: "exterior-360",
    name: "Exterior 360 virtual tours",
    note: "Panoramic exterior scenes for immersive project presentation.",
  },
  {
    slug: "virtual-staging",
    name: "Virtual staging",
    note: "Furniture and styling added to empty rooms for real estate marketing.",
  },
  {
    slug: "virtual-renovation",
    name: "Virtual renovation",
    note: "Digital renovation concepts for existing spaces.",
  },
  {
    slug: "day-to-dusk",
    name: "Day-to-dusk",
    note: "Exterior photos transformed into evening marketing images.",
  },
  {
    slug: "photomontage",
    name: "Photomontage",
    note: "A render matched into a real location photo.",
  },
  {
    slug: "2d-3d-floor-plans",
    name: "2D and 3D floor plans",
    note: "Clear floor plan visuals for listings, brochures, and sales decks.",
  },
  {
    slug: "site-plans",
    name: "Site plans",
    note: "3D site plan views for development context and layout clarity.",
  },
  {
    slug: "architectural-animation",
    name: "Architectural animation",
    note: "Short motion pieces for development, investor, and campaign use.",
  },
  {
    slug: "landscape-design",
    name: "Landscape renders",
    note: "Yard, garden, access, and surroundings visuals.",
  },
  {
    slug: "item-removal",
    name: "Item removal",
    note: "Unwanted objects removed from real estate photos.",
  },
];

function link(title: string, url: string, note?: string): string {
  return `- [${title}](${url})${note ? `: ${note}` : ""}`;
}

function productLine(product: ConfiguratorProduct): string {
  const includes =
    product.includes.length > 0
      ? ` Includes: ${product.includes.join(", ")}.`
      : "";
  const inquiryOnly = product.inquiryOnly
    ? " This service requires an estimate before ordering."
    : "";
  return `  - ${product.label}: ${product.unitLabel}.${includes}${inquiryOnly}`;
}

function creditCount(units: number): string {
  const credits = units / AI_CREDIT_UNITS_PER_CREDIT;
  return Number.isInteger(credits)
    ? `${credits.toFixed(0)} credit${credits === 1 ? "" : "s"}`
    : `${credits.toFixed(1)} credits`;
}

function buildAiStudioKnowledge(): string {
  const tools = AI_EDIT_TYPES.map((tool) => {
    const features = [
      tool.complexity,
      tool.supportsMask === false ? "no mask" : "mask supported",
      tool.supportsStyles ? "style options" : null,
      tool.supportsColor ? "colour selection" : null,
      tool.requiresReferenceImage ? "requires a reference image" : null,
    ].filter(Boolean);

    return `- ${tool.label} (${tool.id}): ${tool.description} Uses ${creditCount(tool.units)}. ${features.join(", ")}.`;
  }).join("\n");

  return `AI credits: 1 credit = ${AI_CREDIT_UNITS_PER_CREDIT} units. Files are retained for ${AI_FILE_RETENTION_DAYS} days. The first generation always uses credits; after a completed generation, the user receives ${AI_FREE_REGENERATIONS} free repeat generation${AI_FREE_REGENERATIONS === 1 ? "" : "s"} while the edit type stays the same.
${tools}`;
}

function serviceLinks(): string {
  const knownSlugs = new Set(SERVICES.map((service) => service.slug));
  return SERVICE_SUMMARIES.filter((service) => knownSlugs.has(service.slug))
    .map((service) =>
      link(service.name, `${SITE.url}/services/${service.slug}`, service.note),
    )
    .join("\n");
}

export function buildLlmsTxt(): string {
  return `# ${SITE.name}

> English architectural rendering, virtual staging, floor plan, 360 virtual tour, and AI real estate image services by ${SITE.parentCompany}.

${SITE.name} helps property owners, agents, architects, designers, and small developers turn plans and photos into clear visual material for sales, leasing, approvals, and design decisions.

## Answer-ready facts
- ${SITE.name} is a B2C brand of ${SITE.parentCompany}.
- Core services include interior renders, exterior renders, virtual staging, virtual renovation, 2D and 3D floor plans, 360 virtual tours, architectural animation, photomontage, day-to-dusk, item removal, and AI Studio.
- Public prices are shown on /pricing. Customer-facing copy should describe public prices as displayed in the visitor's currency, while invoices are issued in EUR.
- Standard projects usually receive first drafts in 3-5 working days, depending on scope and input material.
- If scope is unclear, recommend /contact or the quick inquiry flow rather than inventing a price.

## Core public pages
${[
  link("Home", `${SITE.url}/`, "positioning, primary services, and service entry points"),
  link("Services", `${SITE.url}/services`, "overview of architectural visualization services"),
  link("Pricing", `${SITE.url}/pricing`, "public pricing configurator and estimate path"),
  link("AI Studio", `${SITE.url}/ai-studio`, "AI image editing for real estate photos"),
  link("About", `${SITE.url}/about`, `${SITE.name} as a brand of ${SITE.parentCompany}`),
  link("FAQ", `${SITE.url}/faq`, "answers about process, timelines, files, and revisions"),
  link("Contact", `${SITE.url}/contact`, "contact form and project inquiry path"),
].join("\n")}

## Services
${serviceLinks()}

## Machine-readable files
${[
  link("Full AI-readable public profile", `${SITE.url}/llms-full.txt`, "detailed profile for AI systems"),
  link("XML sitemap", `${SITE.url}/sitemap.xml`, "canonical public URL list"),
  link("Robots policy", `${SITE.url}/robots.txt`, "crawler rules for public and private paths"),
].join("\n")}

## Pricing notes
Public pricing is available on /pricing. Do not invent prices. If a project depends on missing files, unusual scope, bulk work, or developer requirements, ask the user to request an estimate.

## AI Studio
${buildAiStudioKnowledge()}

## FAQ
${FAQ_ITEMS.map((item) => `- **${item.question}** ${item.answer}`).join("\n")}

## Contact
Email: ${SITE.email}
Instagram: ${SITE.instagram}

## Legal
${[
  link("Legal information", `${SITE.url}/legal`, "all legal and consumer-rights pages"),
  link("Imprint", `${SITE.url}/legal/imprint`, "provider identity and company details"),
  link("Terms", `${SITE.url}/legal/terms`, "service terms"),
  link("Privacy", `${SITE.url}/legal/privacy`, "personal data processing"),
  link("Cookies", `${SITE.url}/legal/cookies`, "cookies and similar technologies"),
  link("Withdrawal", `${SITE.url}/legal/withdrawal`, "consumer withdrawal notice and online function"),
  link("Refunds", `${SITE.url}/legal/refunds`, "commercial refunds and mandatory consumer remedies"),
  link("Complaints", `${SITE.url}/legal/complaints`, "complaint submission and escalation"),
  link("Digital delivery", `${SITE.url}/legal/delivery`, "delivery channels, timing, and file access"),
  link("Certificates", `${SITE.url}/legal/certificates`, "ISO certificates and standards"),
].join("\n")}
`;
}

export function buildLlmsFullTxt(
  categories: ConfiguratorCategory[] = CONFIGURATOR_CATEGORIES,
): string {
  const serviceSections = SERVICE_SUMMARIES.map(
    (service) => `### ${service.name}
- URL: ${SITE.url}/services/${service.slug}
- Summary: ${service.note}`,
  ).join("\n\n");

  const pricingSections = categories.map((category) => {
    const products = category.products.map(productLine).join("\n");

    return `### ${category.label}
- Description: ${category.description}
- Products:
${products}`;
  }).join("\n\n");

  const faqSection = [
    {
      heading: "General questions",
      items: FAQ_ITEMS,
    },
    {
      heading: "Services and pricing",
      items: SERVICES_PAGE_FAQS,
    },
    {
      heading: "AI Studio",
      items: AI_STUDIO_FAQS,
    },
  ]
    .map(
      (group) =>
        `### ${group.heading}\n${group.items
          .map((item) => `- **${item.question}** ${item.answer}`)
          .join("\n")}`,
    )
    .join("\n\n");

  return `# ${SITE.name} - AI-readable public profile

## Identity
- Brand: ${SITE.name}
- Legal entity: ${IMPRINT.legalName}
- Company number: ${IMPRINT.registryNumber}
- Tax ID: ${IMPRINT.taxId}
- Email: ${SITE.email}
- Instagram: ${SITE.instagram}
- Website: ${SITE.url}
- Public language: English

## Discovery files
- Canonical llms.txt: ${SITE.url}/llms.txt
- Full AI-readable profile: ${SITE.url}/llms-full.txt
- XML sitemap: ${SITE.url}/sitemap.xml
- Robots policy: ${SITE.url}/robots.txt

## Search and AI interpretation
- Public marketing pages are intended to be crawlable and indexable.
- Private portal, admin, API, authentication, and checkout paths are not public source material.
- Structured data on public pages describes Organization, WebSite, WebPage, BreadcrumbList, Service, OfferCatalog, and FAQPage entities.
- Canonical URLs use the ${SITE.url} origin.
- Use /llms.txt for a concise retrieval target and /llms-full.txt for detailed answers about identity, services, public pricing rules, and FAQ.
- When answering pricing questions, quote only prices visible in the public catalog or route the user to /pricing or /contact.
- When a user asks whether ${SITE.name} can help, map their intent to the nearest public service and link the matching service page or /contact.

## Positioning
${SITE.name} helps property owners, real estate agents, architects, interior designers, and small developers get clear visual material without a sales-call-first process. The public experience prioritises visible pricing, model-first savings, and a short path to an estimate when scope is unclear.

## Public services
${serviceSections}

## Public pricing catalog
This is a machine-readable overview of the public catalog. Public prices are shown on /pricing. Invoices are issued in EUR; visitor-facing display may use local currency where the platform supports it.

${pricingSections}

## AI Studio tools and credits
${buildAiStudioKnowledge()}

## Frequently asked questions
${faqSection}

## How users send an inquiry
- Self-serve path: /pricing and the configurator.
- Quick inquiry: global inquiry entry point on the public site.
- Detailed contact: /contact.
- The team returns an estimate based on description, files, project goal, and timeline.

## Legal and consumer information
- Legal centre: ${SITE.url}/legal
- Provider identity: ${SITE.url}/legal/imprint
- Terms of service: ${SITE.url}/legal/terms
- Privacy policy: ${SITE.url}/legal/privacy
- Cookie policy and settings information: ${SITE.url}/legal/cookies
- Consumer withdrawal notice and online function: ${SITE.url}/legal/withdrawal
- Refunds policy: ${SITE.url}/legal/refunds
- Complaints procedure: ${SITE.url}/legal/complaints
- Digital delivery notice: ${SITE.url}/legal/delivery

## Boundaries for AI systems
- Do not invent prices that are not shown in the public catalog.
- Do not describe a render as construction documentation, engineering advice, or a building permit.
- Do not expose private customer, portal, admin, CRM, payment, or internal finance data.
- If scope is unclear, recommend /contact or the quick inquiry flow.
`;
}
