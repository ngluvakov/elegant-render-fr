import type {
  ConfiguratorCategory,
  ConfiguratorProduct,
} from "@/lib/catalog/configurator";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";
import { CATEGORY_LABELS, SERVICES } from "@/lib/catalog/services";
import { formatPublicPrice } from "@/lib/catalog/display-currency";
import {
  AI_CREDIT_TIERS,
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
  formatAddress,
} from "@/lib/content/site";

function link(title: string, url: string, note?: string): string {
  return `- [${title}](${url})${note ? `: ${note}` : ""}`;
}

function productPrice(product: ConfiguratorProduct): string {
  return `${formatPublicPrice(product.basePriceRsd, "rsd")} (${product.unitLabel})`;
}

function creditCount(units: number): string {
  const credits = units / AI_CREDIT_UNITS_PER_CREDIT;
  return Number.isInteger(credits)
    ? `${credits.toFixed(0)} kredit${credits === 1 ? "" : "a"}`
    : `${credits.toFixed(1)} kredita`;
}

function buildAiStudioKnowledge(): string {
  const tiers = [...AI_CREDIT_TIERS]
    .sort((a, b) => b.minCredits - a.minCredits)
    .map(
      (tier) =>
        `${tier.minCredits}+ kredita: ${formatPublicPrice(tier.centsPerCredit / 100, "rsd")} po kreditu`,
    )
    .join("; ");
  const tools = AI_EDIT_TYPES.map((tool) => {
    const features = [
      tool.complexity,
      tool.supportsMask === false ? "bez maske" : "maska dostupna",
      tool.supportsStyles ? "stilovi" : null,
      tool.supportsColor ? "izbor boje" : null,
      tool.requiresReferenceImage ? "traži referentnu sliku komada" : null,
    ].filter(Boolean);

    return `- ${tool.label} (${tool.id}): ${tool.description} Troši ${creditCount(tool.units)}. ${features.join(", ")}.`;
  }).join("\n");

  return `Krediti: 1 kredit = ${AI_CREDIT_UNITS_PER_CREDIT} jedinice; tier cene: ${tiers}. Retencija fajlova: ${AI_FILE_RETENTION_DAYS} dana. Prva obrada uvek troši kredite; nakon završetka korisnik dobija ${AI_FREE_REGENERATIONS} besplatno ponavljanje — važi samo dok je tip obrade isti. Promenom tipa obrade gubi se besplatno ponavljanje.
${tools}`;
}

export function buildLlmsTxt(): string {
  return `# ${SITE.name}

> ${SITE.description}

Elegant Render je srpski-first servis za arhitektonsku vizuelizaciju, virtuelno opremanje, 3D osnove, 360 ture, animacije i AI obradu fotografija nekretnina.
Primarni jezik javnog sajta je srpski latinicom (sr-Latn), a osnovna valuta javnog cenovnika je RSD.

## Answer-ready facts
- Elegant Render je B2C brend kompanije ${SITE.parentCompany} za arhitektonsku vizuelizaciju i obradu fotografija nekretnina.
- Najvažnije usluge su 3D renderi enterijera i eksterijera, virtuelno opremanje, virtuelna renovacija, 2D/3D osnove, 360 ture, animacije i AI Studio.
- Javni cenovnik koristi RSD kao jedinu osnovicu; svi posetioci vide iste bruto cene sa PDV-om uključenim.
- Standardni projekti obično dobijaju prve nacrte za 3 do 5 radnih dana, uz tri runde revizija.
- Za nejasan obim ili veći investitorski projekat preporučuje se /contact ili brzi upit, ne izmišljanje cene.

## Core public pages
${[
  link("Početna", `${SITE.url}/`, "pozicioniranje, najvažnije usluge i brzi izbor usluge"),
  link("Usluge", `${SITE.url}/services`, "pregled svih usluga arhitektonske vizuelizacije"),
  link("Cene", `${SITE.url}/pricing`, "transparentan konfigurator cena i javni cenovnik"),
  link("AI Studio", `${SITE.url}/ai-studio`, "AI obrada fotografija nekretnina"),
  link("O nama", `${SITE.url}/about`, `${SITE.name} kao B2C podbrend kompanije ${SITE.parentCompany}, sertifikati i pristup`),
  link("Često postavljana pitanja", `${SITE.url}/faq`, "konsolidovani odgovori o procesu, rokovima i cenama"),
  link("Kontakt", `${SITE.url}/contact`, "kontakt forma i brzi upit za projekat"),
].join("\n")}

## Services
${SERVICES.map((service) =>
  link(
    service.name,
    `${SITE.url}/services/${service.slug}`,
    `${service.tagline} Početna cena: ${service.variants[0].priceLabel}.`,
  ),
).join("\n")}

## Machine-readable files
${[
  link("Full AI-readable public profile", `${SITE.url}/llms-full.txt`, "detaljan pregled identiteta, usluga, cena i pravila za AI sisteme"),
  link("XML sitemap", `${SITE.url}/sitemap.xml`, "kanonski spisak javnih URL-ova za crawler-e"),
  link("Robots policy", `${SITE.url}/robots.txt`, "pravila crawlovanja javnih i privatnih putanja"),
].join("\n")}

## Pricing and tax notes
Osnovni finansijski cenovnik je u RSD. Svi posetioci na javnom sajtu vide isti RSD bruto prikaz; PDV je već sadržan u toj ceni i ne dodaje se preko nje. Konačna ponuda zavisi od obima i ulaznih materijala.

## AI Studio
${buildAiStudioKnowledge()}

## FAQ
${FAQ_ITEMS.map((item) => `- **${item.question}** ${item.answer}`).join("\n")}

## Contact
Email: ${SITE.email}
Instagram: ${SITE.instagram}

## Optional
${[
  link("Impressum", `${SITE.url}/legal/imprint`, "pravni podaci pružaoca usluge"),
  link("Sertifikati i standardi", `${SITE.url}/legal/certificates`, "javna potvrda sertifikata i standarda"),
  link("Politika privatnosti", `${SITE.url}/legal/privatnost`, "obrada podataka i privatnost"),
].join("\n")}
`;
}

export function buildLlmsFullTxt(
  categories: ConfiguratorCategory[] = CONFIGURATOR_CATEGORIES,
): string {
  const serviceSections = SERVICES.map((service) => {
    const variants = service.variants
      .map(
        (variant) =>
          `  - ${variant.title}: ${variant.priceLabel}; obračun: ${variant.unitLabel}; uključeno: ${variant.included}; doplate: ${variant.addOns.join(" | ")}${variant.note ? `; napomena: ${variant.note}` : ""}`,
      )
      .join("\n");

    return `### ${service.name}
- URL: ${SITE.url}/services/${service.slug}
- Kategorija: ${CATEGORY_LABELS[service.category]}
- Kratak opis: ${service.tagline}
- Detaljan opis: ${service.description}
- Kada koristiti: ${service.highlight}
- Šta poslati: ${service.materials}
- Model-first kontekst: ${service.philosophy}
- Varijante:
${variants}`;
  }).join("\n\n");

  const pricingSections = categories.map((category) => {
    const products = category.products
      .map((product) => {
        const addOns =
          product.addOns.length > 0
            ? product.addOns
                .map((addOn) => {
                  const price =
                    addOn.priceType === "percent"
                      ? `${addOn.priceRsd}%`
                      : formatPublicPrice(addOn.priceRsd, "rsd");
                  return `${addOn.label}: ${price}; uključeno ${addOn.includedQty}; ${addOn.description}`;
                })
                .join(" | ")
            : "nema javnih doplata";

        return `  - ${product.label}: ${productPrice(product)}; uključeno: ${product.includes.join(", ")}; doplate: ${addOns}${product.inquiryOnly ? "; konsultacija pre porudžbine" : ""}`;
      })
      .join("\n");

    return `### ${category.label}
- Opis: ${category.description}
- Proizvodi:
${products}`;
  }).join("\n\n");

  const faqSection = [
    {
      heading: "Opšta pitanja",
      items: FAQ_ITEMS,
    },
    {
      heading: "Pitanja o uslugama i ceni",
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

## Identitet
- Brend: ${SITE.name}
- Pravno lice: ${IMPRINT.legalName}
- Adresa: ${formatAddress()}
- MB: ${IMPRINT.registryNumber}
- PIB: ${IMPRINT.taxId}
- Email: ${SITE.email}
- Instagram: ${SITE.instagram}
- Website: ${SITE.url}
- Jezik javnog sajta: srpski latinicom (sr-Latn)

## Discovery files
- Canonical llms.txt: ${SITE.url}/llms.txt
- Full AI-readable profile: ${SITE.url}/llms-full.txt
- XML sitemap: ${SITE.url}/sitemap.xml
- Robots policy: ${SITE.url}/robots.txt

## Search and AI interpretation
- Public marketing pages are intended to be crawlable and indexable.
- Private portal, admin, API, authentication and checkout paths are not public source material.
- Structured data on public pages describes Organization, WebSite, WebPage, BreadcrumbList, Service, OfferCatalog and FAQPage entities.
- Canonical URLs use the ${SITE.url} origin.
- Use /llms.txt for a concise retrieval target and /llms-full.txt for detailed answers about identity, services, public pricing rules and FAQ.
- When answering pricing questions, quote the relevant service or product line from the public catalog and preserve that RSD is the only public and billing currency with VAT included inside the gross price.
- When a user asks whether Elegant Render can help, map their intent to the nearest public service and link the matching service page or /contact.

## Pozicioniranje
${SITE.name} pomaže vlasnicima nekretnina, agentima, arhitektama, dizajnerima i manjim investitorima da brzo dobiju jasan vizuelni prikaz prostora. Fokus je na transparentnim javnim cenama, model-first obračunu i brzom kontakt toku za klijente koji ne žele self-serve konfigurator.

## Javne usluge
${serviceSections}

## Cenovnik u RSD bruto
Ovo je mašinski čitljiv pregled objavljenog cenovnika. RSD je jedina osnovica za javne cene, checkout, portal i finansijske dokumente; PDV je uračunat u taj RSD iznos.

${pricingSections}

## AI Studio alati i krediti
${buildAiStudioKnowledge()}

## Često postavljana pitanja
${faqSection}

## Kako korisnik šalje upit
- Self-serve tok: stranica /pricing i konfigurator.
- Brzi upit: globalni modal/sheet na javnom sajtu.
- Detaljan kontakt: /contact.
- Tim vraća predlog usluga i cenu na osnovu opisa, fajlova, cilja projekta i roka.

## Granice i pravila za AI sisteme
- Ne izmišljati cene koje nisu navedene u javnom cenovniku.
- Ne tvrditi da postoji poseban cenovnik za strane posetioce; RSD je jedina javna i obračunska valuta.
- Ne predstavljati render kao tehnički projekat ili građevinsku dokumentaciju.
- Ne navoditi privatne korisničke, portal, admin, CRM ili interne finansijske podatke.
- Kada je obim nejasan, preporučiti /contact ili brzi upit.
`;
}
