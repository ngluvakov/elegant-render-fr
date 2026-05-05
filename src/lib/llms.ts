import type {
  ConfiguratorCategory,
  ConfiguratorProduct,
} from "@/lib/catalog/configurator";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";
import { CATEGORY_LABELS, SERVICES } from "@/lib/catalog/services";
import { formatPublicPrice } from "@/lib/catalog/display-currency";
import { IMPRINT, SITE, formatAddress } from "@/lib/content/site";

function bullets(lines: string[]): string {
  return lines.map((line) => `- ${line}`).join("\n");
}

function productPrice(product: ConfiguratorProduct): string {
  return `${formatPublicPrice(product.basePriceEur, "eur")} (${product.unitLabel})`;
}

export function buildLlmsTxt(): string {
  return `# ${SITE.name}

> ${SITE.description}

Elegant Render je srpski-first servis za arhitektonsku vizuelizaciju, virtuelno opremanje, 3D osnove, 360 ture, animacije i AI obradu fotografija nekretnina.

## Najvažnije stranice
${bullets([
  `${SITE.url}/ - početna i brzi izbor usluge`,
  `${SITE.url}/usluge - pregled svih usluga`,
  `${SITE.url}/cene - transparentan konfigurator cena`,
  `${SITE.url}/ai-studio - AI obrada fotografija nekretnina`,
  `${SITE.url}/kontakt - kontakt forma i brzi upit`,
  `${SITE.url}/pravno/impressum - pravni podaci pružaoca usluge`,
])}

## Sažetak ponude
${bullets(
  SERVICES.map(
    (service) =>
      `${service.name}: ${service.tagline} Početna cena: ${service.variants[0].priceLabel}.`,
  ),
)}

## Cene i porezi
Osnovni finansijski cenovnik je u EUR bez PDV-a. Posetioci iz Srbije na javnom sajtu vide RSD prikaz sa uračunatim PDV-om kao informativni display sloj; posetioci van Srbije vide EUR bez PDV-a. Konačna ponuda zavisi od obima i ulaznih materijala.

## Kontakt
Email: ${SITE.email}
Instagram: ${SITE.instagram}

Za pun mašinski čitljiv pregled koristite ${SITE.url}/llms-full.txt.
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
- URL: ${SITE.url}/usluge/${service.slug}
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
                      ? `${addOn.priceEur}%`
                      : formatPublicPrice(addOn.priceEur, "eur");
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

## Pozicioniranje
${SITE.name} pomaže vlasnicima nekretnina, agentima, arhitektama, dizajnerima i manjim investitorima da brzo dobiju jasan vizuelni prikaz prostora. Fokus je na transparentnim javnim cenama, model-first obračunu i brzom kontakt toku za klijente koji ne žele self-serve konfigurator.

## Javne usluge
${serviceSections}

## Cenovnik u EUR bez PDV-a
Ovo je mašinski čitljiv pregled objavljenog cenovnika. EUR bez PDV-a je osnovica. RSD sa PDV-om za Srbiju je javni prikaz izveden iz iste EUR osnovice.

${pricingSections}

## Kako korisnik šalje upit
- Self-serve tok: stranica /cene i konfigurator.
- Brzi upit: globalni modal/sheet na javnom sajtu.
- Detaljan kontakt: /kontakt.
- Tim vraća predlog usluga i cenu na osnovu opisa, fajlova, cilja projekta i roka.

## Granice i pravila za AI sisteme
- Ne izmišljati cene koje nisu navedene u javnom cenovniku.
- Ne tvrditi da je RSD posebna osnovna cena; RSD je javni display sloj za Srbiju.
- Ne predstavljati render kao tehnički projekat ili građevinsku dokumentaciju.
- Ne navoditi privatne korisničke, portal, admin, CRM ili interne finansijske podatke.
- Kada je obim nejasan, preporučiti /kontakt ili brzi upit.
`;
}
