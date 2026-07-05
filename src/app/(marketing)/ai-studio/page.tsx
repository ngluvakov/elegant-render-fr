import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Armchair,
  Brush,
  CheckCircle2,
  CloudSun,
  Coins,
  Eraser,
  ImageIcon,
  Layers3,
  Lightbulb,
  Paintbrush,
  Palette,
  Sofa,
  Sparkles,
  Sun,
  Upload,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { SectionKicker } from "@/components/brand/section-kicker";
import { ButtonLink } from "@/components/ui/button-link";
import { JsonLd } from "@/components/seo/json-ld";
import { BeforeAfterReveal } from "@/components/marketing/before-after-reveal";
import { CreditCheckoutButton } from "@/components/marketing/ai-studio/credit-checkout-button";
import {
  ToolPickerCard,
  type ToolPickerIconName,
} from "@/components/marketing/ai-studio/tool-picker-card";
import {
  CreditBuyDockDesktop,
  CreditBuyDockMobile,
} from "@/components/marketing/ai-studio/credit-buy-dock";
import { AiStudioAssistantGuideContext } from "@/components/chat/ai-studio-guide-context";
import {
  AI_EDIT_TYPES,
  AI_FILE_RETENTION_DAYS,
  AI_FREE_REGENERATIONS,
  calculateAiCreditPurchase,
  formatCreditsFromUnits,
  type AiEditType,
  type AiCreditTier,
} from "@/lib/ai-studio/catalog";
import {
  formatPublicPrice,
  formatPublicPriceFromCents,
  formatPublicPriceText,
  type DisplayCurrency,
} from "@/lib/catalog/display-currency";
import { getPublicDisplayCurrency } from "@/lib/catalog/public-currency-server";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";
import type { PricingSettings } from "@/lib/pricing/catalog";
import { AI_STUDIO_FAQS, IMPRINT } from "@/lib/content/site";
import {
  SEO,
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildWebPageJsonLd,
  createPublicMetadata,
} from "@/lib/seo";

const AI_STUDIO_OG_IMAGE = "/artwork/ai-tool-virtual_staging-after.webp";
const AI_STUDIO_IMAGE_ALT =
  "AI Studio - primer virtuelnog opremanja praznog prostora za oglas nekretnine";

export const metadata: Metadata = createPublicMetadata({
  title: "AI Studio",
  description:
    "Brza AI obrada fotografija nekretnina: uklanjanje elemenata, dan-u-noć, zamena neba, boja zidova, staging, dodavanje ili zamena nameštaja/dekora, renovacija i redesign.",
  path: "/ai-studio",
  image: AI_STUDIO_OG_IMAGE,
  imageAlt: AI_STUDIO_IMAGE_ALT,
  keywords: [
    "AI obrada fotografija nekretnina",
    "AI virtual staging",
    "AI uklanjanje predmeta sa slike",
  ],
});

type ToolDetail = {
  icon: LucideIcon;
  benefit: string;
  input: string;
  output: string;
  prompt: string;
  /** Single legacy image (kept for tools that have artwork but no
   *  before/after pair yet). */
  imageSrc?: string;
  /** Before/after pair — when both are set, the picker card renders a
   *  diagonal reveal that follows the mouse on desktop and demos itself
   *  on mobile. Populate per-tool as paired WebPs land in /artwork/. */
  beforeSrc?: string;
  afterSrc?: string;
  gradient: string;
};

const toolDetails: Record<AiEditType, ToolDetail> = {
  item_removal: {
    icon: Eraser,
    benefit:
      "Očistite kadar od nereda, ljudi, vozila ili sitnih smetnji pre objave oglasa.",
    input: "Fotografija + šta uklanjamo",
    output: "Čista fotografija",
    prompt:
      "Ukloni kese i kablove pored zida. Sačuvaj pod i senke što prirodnije.",
    beforeSrc: "/artwork/ai-tool-item_removal-before.webp",
    afterSrc: "/artwork/ai-tool-item_removal-after.webp",
    gradient: "from-foreground/10 to-foreground/20",
  },
  day_to_dusk: {
    icon: Sun,
    benefit:
      "Pretvorite dnevni kadar u večernju atmosferu koja daje topliji prvi utisak.",
    input: "Fotografija + atmosfera",
    output: "Sutonski ili noćni kadar",
    prompt:
      "Suptilan plavi sat, topla svetla iz prozora, ne menjati boju fasade.",
    beforeSrc: "/artwork/ai-tool-day_to_dusk-before.webp",
    afterSrc: "/artwork/ai-tool-day_to_dusk-after.webp",
    gradient: "from-accent/20 to-[color:var(--color-sage-deep)]/20",
  },
  sky_replacement: {
    icon: CloudSun,
    benefit:
      "Zadržite dobar kadar, ali zamenite sivo ili pregorelo nebo boljom atmosferom.",
    input: "Eksterijer sa vidljivim nebom",
    output: "Fotografija sa boljim nebom",
    prompt:
      "Blago oblačno nebo, ne menjati boju zgrade ni ekspoziciju fasade.",
    beforeSrc: "/artwork/ai-tool-sky_replacement-before.webp",
    afterSrc: "/artwork/ai-tool-sky_replacement-after.webp",
    gradient: "from-[color:var(--color-sage)]/15 to-[color:var(--color-sage-deep)]/25",
  },
  wall_color_change: {
    icon: Paintbrush,
    benefit:
      "Testirajte novu boju zida pre nego što prostor zaista prefarbate.",
    input: "Fotografija + ciljna boja",
    output: "Nova boja zida",
    prompt:
      "Promeni samo zid iza kreveta. Plafon, lajsne i nameštaj ostaju isti.",
    beforeSrc: "/artwork/ai-tool-wall_color_change-before.webp",
    afterSrc: "/artwork/ai-tool-wall_color_change-after.webp",
    gradient: "from-accent/15 to-accent/25",
  },
  virtual_staging: {
    icon: Sofa,
    benefit:
      "Prazan prostor pretvorite u sobu koju kupac odmah razume i emotivno čita.",
    input: "Fotografija + tip sobe + stil",
    output: "Opremljen prostor",
    prompt:
      "Dnevna soba, topao moderni stil, neutralna paleta, drvo i svetli tekstil.",
    beforeSrc: "/artwork/ai-tool-virtual_staging-before.webp",
    afterSrc: "/artwork/ai-tool-virtual_staging-after.webp",
    gradient: "from-accent/15 to-accent/25",
  },
  object_insertion: {
    icon: Armchair,
    benefit:
      "Dodajte konkretan komad nameštaja/dekora ili zamenite postojeći komad uz više uglova istog modela.",
    input: "Enterijer + do 5 uglova komada",
    output: "Komad dodat ili zamenjen",
    prompt:
      "Zameni postojeću fotelju referentnim modelom. Sačuvaj skalu, svetlo i senku na podu.",
    beforeSrc: "/artwork/ai-tool-object_insertion-before.webp",
    afterSrc: "/artwork/ai-tool-object_insertion-after.webp",
    gradient: "from-[color:var(--color-sage)]/20 to-foreground/15",
  },
  virtual_renovation: {
    icon: Wand2,
    benefit:
      "Prikažite potencijal renovacije pre skupih odluka o materijalima i radovima.",
    input: "Fotografija + šta menjamo + stil",
    output: "Renovirana varijanta",
    prompt:
      "Zameni pod hrastovim parketom, zidovi topla bela, ostavi raspored kuhinje.",
    beforeSrc: "/artwork/ai-tool-virtual_renovation-before.webp",
    afterSrc: "/artwork/ai-tool-virtual_renovation-after.webp",
    gradient: "from-[color:var(--color-sage)]/20 to-accent/15",
  },
  room_redesign: {
    icon: Palette,
    benefit:
      "Promenite stil i atmosferu postojeće sobe bez kompletnog 3D projekta.",
    input: "Fotografija + tip sobe + stil",
    output: "Nova dizajnerska varijanta",
    prompt:
      "Svetli skandinavski stil, manje vizuelnog nereda, zadržati prozore i osnovni raspored.",
    beforeSrc: "/artwork/ai-tool-room_redesign-before.webp",
    afterSrc: "/artwork/ai-tool-room_redesign-after.webp",
    gradient: "from-[color:var(--color-sage)]/15 to-foreground/15",
  },
};

const workflow = [
  {
    icon: Upload,
    title: "Uploadujte fotografiju",
    text: "JPG, PNG ili WebP do 50 MB. Najbolje rade jasni, široki kadrovi.",
  },
  {
    icon: Sparkles,
    title: "Izaberite AI alat",
    text: "Od brzih korekcija do staginga, zamene nameštaja/dekora, renovacije i redesign-a.",
  },
  {
    icon: Brush,
    title: "Dodajte instrukcije",
    text: "Napišite šta menjamo, šta čuvamo i po potrebi označite masku.",
  },
  {
    icon: ImageIcon,
    title: "Preuzmite rezultat",
    text: "Rezultat možete preuzeti ili koristiti kao novu ulaznu sliku.",
  },
];

const heroProof = {
  beforeSrc: "/artwork/ai-tool-virtual_staging-before.webp",
  afterSrc: AI_STUDIO_OG_IMAGE,
  title: "Prazan prostor u prodajni kadar",
  text: "Before/after primer iz AI Studio alata za virtuelno opremanje.",
};

const trustSignals = [
  "Neuspešna obrada vraća kredite",
  `${AI_FREE_REGENERATIONS} besplatno ponavljanje istog tipa`,
  `Fajlovi se čuvaju ${AI_FILE_RETENTION_DAYS} dana`,
  `Račun izdaje ${IMPRINT.shortName}`,
];

const scenarios = [
  {
    title: "Očistite fotografiju",
    text:
      "Uklonite nered, vozila, ljude ili sitne smetnje. Prostor deluje spremnije za oglas bez fizičke intervencije.",
    bestFor: "Agenti, vlasnici nekretnina, fotografi",
    image: "/artwork/elegant-render-services-before-after-grid.webp",
  },
  {
    title: "Opremite prazan prostor",
    text:
      "Dodajte nameštaj, dekor i atmosferu u izabranom stilu da kupac odmah razume namenu sobe.",
    bestFor: "Agencije, investitori, vlasnici koji prodaju",
    image: "/artwork/elegant-render-virtual-staging-scene.webp",
  },
  {
    title: "Prikažite potencijal renovacije",
    text:
      "Testirajte podove, zidove, materijale i atmosferu pre nego što donesete skupe odluke.",
    bestFor: "Investitori, dizajneri, vlasnici koji renoviraju",
    image: "/artwork/pricing-card-opremanje-renovacija.webp",
  },
];

const tips = [
  "Uploadujte jasnu fotografiju; što bolja rezolucija, to bolji rezultat.",
  "Napišite šta mora da ostane isto: prozori, raspored, pod, materijali.",
  "Ne tražite više nepovezanih stvari u jednoj rečenici.",
  "Za staging navedite namenu sobe, stil i paletu boja.",
  "Za dodavanje ili zamenu nameštaja/dekora uploadujte do 5 uglova istog komada; za zamenu označite postojeći komad maskom.",
  "Za renovaciju odvojite materijale, nameštaj i osvetljenje.",
  "Za uklanjanje većih predmeta koristite masku u Advanced mode-u.",
  "Ako je rezultat blizu dobrog, koristite ga kao novi ulaz i tražite malu korekciju.",
];

const creditPackages = [10, 25, 50, 100];

const MOBILE_LABEL_BY_TOOL: Record<AiEditType, string> = {
  item_removal: "Uklanjanje",
  day_to_dusk: "Dan u noć",
  sky_replacement: "Nebo",
  wall_color_change: "Boja zidova",
  virtual_staging: "Opremanje",
  object_insertion: "Nameštaj/dekor",
  virtual_renovation: "Renovacija",
  room_redesign: "Redizajn",
};

/**
 * Lowest-tier single-purchase starting price for a tool, stored internally
 * in RSD because AI credits and checkout are RSD-only.
 */
function toolStartingRsd(
  units: number,
  tiers: AiCreditTier[],
  unitsPerCredit: number,
): number {
  const sorted = [...tiers].sort((a, b) => b.minCredits - a.minCredits);
  const lowestTier = sorted[sorted.length - 1];
  const rsdPerCredit = lowestTier.centsPerCredit / 100;
  return (units / unitsPerCredit) * rsdPerCredit;
}

function publicTaxNote(_displayCurrency: DisplayCurrency): string {
  void _displayCurrency;
  return "RSD bruto, PDV uračunat.";
}

export default async function AiStudioLandingPage() {
  const [displayCurrency, pricingCatalog] = await Promise.all([
    getPublicDisplayCurrency(),
    getPublishedPricingCatalog(),
  ]);
  const pricingSettings = pricingCatalog.settings;
  const formattedFaqs = AI_STUDIO_FAQS.map((item) => ({
    ...item,
    answer: formatPublicPriceText(item.answer, displayCurrency, pricingSettings),
  }));

  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/ai-studio",
            name: "AI Studio za obradu fotografija nekretnina",
            description:
              "AI alati za uklanjanje elemenata, dan-u-noć, zamenu neba, virtuelno opremanje, dodavanje ili zamenu nameštaja/dekora, renovaciju i redesign prostora.",
          }),
          buildBreadcrumbJsonLd([
            { name: "Početna", path: "/" },
            { name: "AI Studio", path: "/ai-studio" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "AI Studio",
            serviceType: "AI obrada fotografija nekretnina",
            url: absoluteUrl("/ai-studio"),
            provider: {
              "@id": SEO.organizationId,
            },
            image: {
              "@type": "ImageObject",
              url: absoluteUrl(AI_STUDIO_OG_IMAGE),
              contentUrl: absoluteUrl(AI_STUDIO_OG_IMAGE),
              name: AI_STUDIO_IMAGE_ALT,
              caption:
                "AI Studio prikazuje kako prazna fotografija enterijera postaje prodajni vizual kroz virtuelno opremanje.",
              inLanguage: SEO.htmlLang,
            },
            offers: {
              "@type": "OfferCatalog",
              name: "AI alati",
              itemListElement: AI_EDIT_TYPES.map((item) => ({
                "@type": "Offer",
                name: item.label,
                description: toolDetails[item.id].benefit,
                priceCurrency: "RSD",
                price: toolStartingRsd(
                  item.units,
                  pricingSettings.aiCreditTiers,
                  pricingSettings.aiCreditUnitsPerCredit,
                ),
              })),
            },
          },
          buildFaqJsonLd(formattedFaqs),
        ]}
      />
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 pt-20 md:pt-28">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
          <div className="min-w-0">
            <HeroContent
              displayCurrency={displayCurrency}
              pricingSettings={pricingSettings}
            />
            <ToolPickerGrid
              displayCurrency={displayCurrency}
              pricingSettings={pricingSettings}
            />
          </div>
          <CreditBuyDockDesktop
            pricingSettings={pricingSettings}
            displayCurrency={displayCurrency}
          />
        </div>
      </div>
      <WorkflowSection />
      <ToolsSection pricingSettings={pricingSettings} />
      <ScenarioSection />
      <ComparisonSection
        displayCurrency={displayCurrency}
        pricingSettings={pricingSettings}
      />
      <CreditsSection
        displayCurrency={displayCurrency}
        pricingSettings={pricingSettings}
      />
      <TipsSection />
      <FaqSection faqs={formattedFaqs} />
      <FinalCtaSection />
      <CreditBuyDockMobile
        pricingSettings={pricingSettings}
        displayCurrency={displayCurrency}
      />
      {/* Declares page "ai_studio" so the chat assistant gains page awareness
          and lifts its FAB/bubble above the mobile credit dock. */}
      <AiStudioAssistantGuideContext />
    </>
  );
}

function HeroContent({
  displayCurrency,
  pricingSettings,
}: {
  displayCurrency: DisplayCurrency;
  pricingSettings: PricingSettings;
}) {
  const simpleStarting = formatPublicPrice(
    toolStartingRsd(
      1,
      pricingSettings.aiCreditTiers,
      pricingSettings.aiCreditUnitsPerCredit,
    ),
    displayCurrency,
    pricingSettings,
  );

  return (
    <div className="grid items-start gap-7 xl:grid-cols-2">
      <div>
        <SectionKicker>AI Studio</SectionKicker>
        <h1 className="mt-4 max-w-3xl text-4xl leading-[1.08] text-foreground sm:text-5xl 2xl:text-6xl">
          AI obrada koja vašu fotografiju pretvori u prodajni vizual
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Uploadujte fotografiju, izaberite alat i dobijte spreman vizuelni
          rezultat za oglas, prezentaciju ili proveru ideje. Osam alata, od{" "}
          {simpleStarting} po obradi.
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-xs text-foreground/82">
          <span className="rounded-full bg-secondary px-3 py-1">
            Simple ={" "}
            {formatCreditsFromUnits(
              1,
              pricingSettings.aiCreditUnitsPerCredit,
            )}{" "}
            · Complex ={" "}
            {formatCreditsFromUnits(
              2,
              pricingSettings.aiCreditUnitsPerCredit,
            )}
          </span>
          <span className="rounded-full bg-secondary px-3 py-1">
            {publicTaxNote(displayCurrency)}
          </span>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <CreditCheckoutButton label="Kupi kredite i počni" />
          <ButtonLink href="/portal/ai-studio" variant="outline" size="lg">
            Otvori AI Studio
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>

        <ul className="mt-6 grid max-w-2xl gap-2 text-xs text-foreground/78 sm:grid-cols-2">
          {trustSignals.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-none text-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-[0_24px_70px_-36px_rgba(28,26,25,0.28)]">
        <BeforeAfterReveal
          beforeSrc={heroProof.beforeSrc}
          afterSrc={heroProof.afterSrc}
          alt={AI_STUDIO_IMAGE_ALT}
          beforeAlt="AI Studio - prazna prostorija pre virtuelnog opremanja"
          afterAlt={AI_STUDIO_IMAGE_ALT}
          sizes="(max-width: 768px) 100vw, 36vw"
          className="aspect-[4/3] bg-secondary"
          autoDemoIntervalMs={7000}
        >
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-foreground/60 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-background/95">
            Pre / posle
          </span>
        </BeforeAfterReveal>
        <div className="p-4">
          <p className="text-sm font-semibold text-foreground">
            {heroProof.title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {heroProof.text}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Primary entry into the buying flow. Mirrors the `CategoryPreview` pattern
 * from /pricing: each card shows the tool's starting public price and links straight
 * into the portal with the tool pre-selected so the customer can start
 * working in one click.
 */
/**
 * Lucide components are functions and can't cross the server → client
 * boundary as a prop (RSC serialization forbids it). Each tool gets a
 * stable string key here that the picker resolves to the matching icon
 * on the client side.
 */
const ICON_NAME_BY_TOOL: Record<AiEditType, ToolPickerIconName> = {
  item_removal: "eraser",
  day_to_dusk: "sun",
  sky_replacement: "cloud-sun",
  wall_color_change: "paintbrush",
  virtual_staging: "sofa",
  object_insertion: "armchair",
  virtual_renovation: "wand",
  room_redesign: "palette",
};

function ToolPickerGrid({
  displayCurrency,
  pricingSettings,
}: {
  displayCurrency: DisplayCurrency;
  pricingSettings: PricingSettings;
}) {
  return (
    <section className="pt-12 pb-2">
      <h2 className="mb-5 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        Šta želite da uradite?
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
        {AI_EDIT_TYPES.map((item) => {
          const detail = toolDetails[item.id];
          const startingRsd = toolStartingRsd(
            item.units,
            pricingSettings.aiCreditTiers,
            pricingSettings.aiCreditUnitsPerCredit,
          );
          return (
            <ToolPickerCard
              key={item.id}
              href={`/portal/ai-studio?tool=${item.id}`}
              label={item.label}
              shortLabel={MOBILE_LABEL_BY_TOOL[item.id]}
              blurb={detail.benefit}
              imageSrc={detail.imageSrc}
              beforeSrc={detail.beforeSrc}
              afterSrc={detail.afterSrc}
              iconName={ICON_NAME_BY_TOOL[item.id]}
              gradient={detail.gradient}
              creditsLabel={formatCreditsFromUnits(
                item.units,
                pricingSettings.aiCreditUnitsPerCredit,
              )}
              startingRsdLabel={formatPublicPrice(
                startingRsd,
                displayCurrency,
                pricingSettings,
              )}
            />
          );
        })}
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="py-10 md:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="max-w-2xl">
          <SectionKicker>Kako radi</SectionKicker>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            Od fotografije do upotrebljivog vizuala u četiri koraka.
          </h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflow.map((item, index) => (
            <article
              key={item.title}
              className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-[0_20px_55px_rgba(28,26,25,0.05)]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm font-semibold text-accent">
                  0{index + 1}
                </span>
                <item.icon className="h-5 w-5 text-foreground/60" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Detailed reference for the eight tools — kept after the picker for
 * customers who want to read deeper before clicking. Drops the empty
 * Input/Output mockup boxes from the previous design (they read as
 * placeholder rather than illustration); each tool's example prompt now
 * does that job.
 */
function ToolsSection({
  pricingSettings,
}: {
  pricingSettings: PricingSettings;
}) {
  return (
    <section className="bg-secondary/35 py-10 md:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <SectionKicker>Alati</SectionKicker>
            <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
              Osam AI obrada za postojeće fotografije.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              Svaki alat ima jasan opseg: od brzog čišćenja fotografije do
              staginga, dodavanja ili zamene nameštaja/dekora, renovacije i redesign-a prostorije. Primer prompta
              ispod svakog alata pokazuje kako da formulišete instrukciju.
            </p>
          </div>
          <Link
            href="/portal/ai-studio"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
          >
            Probaj u portalu
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {AI_EDIT_TYPES.map((item) => {
            const detail = toolDetails[item.id];
            const Icon = detail.icon;
            const capabilities = [
              item.supportsMask !== false ? "Maska" : null,
              item.supportsStyles ? "Stil" : null,
              item.supportsColor ? "Boja" : null,
            ].filter(Boolean);

            return (
              <article
                key={item.id}
                className="flex min-h-full flex-col rounded-2xl border border-border/60 bg-background p-6 shadow-[0_4px_16px_rgba(28,26,25,0.03)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/12 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <span className="rounded-full bg-secondary px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {item.complexity === "simple" ? "Simple" : "Complex"} ·{" "}
                      {formatCreditsFromUnits(
                        item.units,
                        pricingSettings.aiCreditUnitsPerCredit,
                      )}
                    </span>
                    {capabilities.length > 0 && (
                      <span className="rounded-full bg-secondary px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        {capabilities.join(" · ")}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="mt-4 text-xl font-semibold text-foreground">
                  {item.label}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {detail.benefit}
                </p>

                <div className="mt-5 grid gap-2 text-xs text-muted-foreground">
                  <p>
                    <strong className="font-semibold text-foreground">
                      Input:
                    </strong>{" "}
                    {detail.input}
                  </p>
                  <p>
                    <strong className="font-semibold text-foreground">
                      Output:
                    </strong>{" "}
                    {detail.output}
                  </p>
                </div>

                <p className="mt-4 rounded-xl bg-secondary/50 px-3 py-2 text-xs leading-relaxed text-foreground/78">
                  „{detail.prompt}&rdquo;
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ScenarioSection() {
  return (
    <section className="py-10 md:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="max-w-2xl">
          <SectionKicker>Scenariji</SectionKicker>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            Tri najčešća razloga za AI obradu.
          </h2>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {scenarios.map((item) => (
            <article
              key={item.title}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-[0_4px_16px_rgba(28,26,25,0.03)]"
            >
              <Image
                src={item.image}
                alt={`${item.title} - primer AI Studio primene`}
                width={720}
                height={460}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-5">
                <h3 className="text-xl font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {item.text}
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                  Najbolje za: {item.bestFor}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection({
  displayCurrency,
  pricingSettings,
}: {
  displayCurrency: DisplayCurrency;
  pricingSettings: PricingSettings;
}) {
  return (
    <section className="bg-secondary/35 py-10 md:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="max-w-2xl">
          <SectionKicker>Kada šta koristiti</SectionKicker>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            AI Studio ili klasičan render?
          </h2>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <ComparisonCard
            icon={Sparkles}
            title="AI Studio"
            text="Brza obrada postojeće fotografije. Idealan kada već imate kadar i treba vam vizuelna korekcija ili poboljšanje."
            items={[
              "Već imate fotografiju prostora",
              "Treba brza vizuelna provera ili testiranje ideje",
              "Treba bolji oglas za nekretninu",
              "Treba čišćenje ili stilizacija postojeće slike",
              `Cena: od ${formatPublicPrice(
                toolStartingRsd(
                  1,
                  pricingSettings.aiCreditTiers,
                  pricingSettings.aiCreditUnitsPerCredit,
                ),
                displayCurrency,
                pricingSettings,
              )} po jednostavnoj obradi`,
            ]}
            accent
          />
          <ComparisonCard
            icon={Layers3}
            title="Klasičan render"
            text="Ručno izrađen 3D prikaz sa punom kontrolom nad arhitekturom, materijalima i kadrovima."
            items={[
              "Prostor još ne postoji",
              "Treba tačna arhitektura i dimenzije",
              "Treba više kontrolisanih kadrova iste scene",
              "Treba proizvodni nivo detalja",
              "Treba kompletna prodajna kampanja",
            ]}
            link
          />
        </div>
      </div>
    </section>
  );
}

function ComparisonCard({
  icon: Icon,
  title,
  text,
  items,
  accent = false,
  link = false,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  items: string[];
  accent?: boolean;
  link?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-border/60 bg-background p-6 shadow-[0_4px_16px_rgba(28,26,25,0.03)] md:p-8">
      <div className="flex items-center gap-3">
        <span
          className={
            accent
              ? "flex h-10 w-10 items-center justify-center rounded-xl bg-accent/12 text-accent"
              : "flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/8 text-foreground"
          }
        >
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        {text}
      </p>
      <ul className="mt-5 space-y-3 text-sm text-foreground/82">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2
              className={
                accent
                  ? "mt-0.5 h-4 w-4 flex-none text-accent"
                  : "mt-0.5 h-4 w-4 flex-none text-muted-foreground"
              }
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {link && (
        <Link
          href="/services"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
        >
          Pogledajte usluge renderinga
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </article>
  );
}

function CreditsSection({
  displayCurrency,
  pricingSettings,
}: {
  displayCurrency: DisplayCurrency;
  pricingSettings: PricingSettings;
}) {
  const creditTiers = [...pricingSettings.aiCreditTiers].reverse();
  return (
    <section className="py-10 md:py-14 lg:py-20">
      <div className="mx-auto grid w-full max-w-[min(96vw,1720px)] gap-8 px-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <SectionKicker>Krediti</SectionKicker>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            Kupite koliko vam treba.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Krediti važe {pricingSettings.aiCreditExpiresAfterMonths} meseci od poslednje dopune. Veći paketi imaju nižu
            cenu po kreditu, a sistem automatski primenjuje najbolju cenu za
            izabranu količinu. {publicTaxNote(displayCurrency)}
          </p>
          <div className="mt-5 grid gap-2 text-sm text-foreground/82">
            <span className="inline-flex items-center gap-2">
              <Coins className="h-4 w-4 text-accent" />
              Simple obrada = 0.5 kredita
            </span>
            <span className="inline-flex items-center gap-2">
              <Coins className="h-4 w-4 text-accent" />
              Complex obrada = 1 kredit
            </span>
          </div>
          <CreditCheckoutButton className="mt-7" label="Kupi kredite" />
        </div>

        <div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {creditPackages.map((credits) => {
              const purchase = calculateAiCreditPurchase(
                credits,
                pricingSettings.aiCreditTiers,
                pricingSettings.aiCreditUnitsPerCredit,
              );
              return (
                <div
                  key={credits}
                  className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-[0_4px_16px_rgba(28,26,25,0.03)]"
                >
                  <p className="text-4xl font-bold text-foreground">
                    {credits}
                  </p>
                  <p className="text-sm text-muted-foreground">kredita</p>
                  <p className="mt-5 text-2xl font-semibold text-foreground">
                    {formatPublicPriceFromCents(
                      purchase.totalCents,
                      displayCurrency,
                      pricingSettings,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPublicPriceFromCents(
                      purchase.centsPerCredit,
                      displayCurrency,
                      pricingSettings,
                    )}{" "}
                    po kreditu
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {creditTiers.map((tier, index) => {
              const next = creditTiers[index + 1];
              const label = next
                ? `${tier.minCredits}-${next.minCredits - 1}`
                : `${tier.minCredits}+`;
              return (
                <span
                  key={tier.minCredits}
                  className="rounded-full bg-secondary px-3 py-1"
                >
                  {label}:{" "}
                  {formatPublicPriceFromCents(
                    tier.centsPerCredit,
                    displayCurrency,
                    pricingSettings,
                  )}
                  /kredit
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function TipsSection() {
  return (
    <section className="bg-secondary/35 py-10 md:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="max-w-2xl">
          <SectionKicker>Saveti</SectionKicker>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            Za bolji rezultat, recite AI-ju šta treba da ostane isto.
          </h2>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tips.map((tip) => (
            <div
              key={tip}
              className="flex gap-3 rounded-2xl border border-border/60 bg-background p-4 shadow-[0_4px_16px_rgba(28,26,25,0.03)]"
            >
              <Lightbulb className="mt-0.5 h-4 w-4 flex-none text-accent" />
              <p className="text-sm leading-7 text-foreground/82">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection({
  faqs,
}: {
  faqs: ReadonlyArray<{ question: string; answer: string }>;
}) {
  return (
    <section className="py-10 md:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="max-w-2xl">
          <SectionKicker>Česta pitanja</SectionKicker>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            Sve što treba da znate pre prve obrade.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {faqs.map((item) => (
            <article
              key={item.question}
              className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-[0_4px_16px_rgba(28,26,25,0.03)]"
            >
              <h3 className="text-lg font-semibold text-foreground">
                {item.question}
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="px-6 pb-32 lg:pb-24">
      <div className="mx-auto flex w-full max-w-[min(96vw,1720px)] flex-col items-start justify-between gap-6 rounded-2xl bg-foreground p-6 text-background shadow-[0_30px_80px_rgba(28,26,25,0.22)] md:flex-row md:items-center md:p-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-background/60">
            AI Studio
          </p>
          <h2 className="mt-2 text-3xl leading-tight md:text-4xl">
            Spremni za prvu obradu fotografije?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-background/72">
            Počnite sa jednom jasnom fotografijom. Ako niste sigurni koji alat
            je pravi, krenite od cilja: očistiti, opremiti, renovirati ili
            promeniti atmosferu.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CreditCheckoutButton label="Kupi kredite i počni" />
          <ButtonLink
            href="/portal/ai-studio"
            variant="outline"
            size="lg"
            className="border-background/30 text-background hover:bg-background/10"
          >
            Otvori AI Studio
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
