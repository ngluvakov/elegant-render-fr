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
  "AI Studio - virtual staging example of an empty space for a property listing";

export const metadata: Metadata = createPublicMetadata({
  title: "AI Studio",
  description:
    "Fast AI editing for real estate photos: item removal, day-to-dusk, sky replacement, wall color change, virtual staging, furniture and decor insertion or replacement, renovation and redesign.",
  path: "/ai-studio",
  image: AI_STUDIO_OG_IMAGE,
  imageAlt: AI_STUDIO_IMAGE_ALT,
  keywords: [
    "AI real estate photo editing",
    "AI virtual staging",
    "AI item removal",
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
};

const toolDetails: Record<AiEditType, ToolDetail> = {
  item_removal: {
    icon: Eraser,
    benefit:
      "Clear the shot of clutter, people, vehicles or small distractions before the listing goes live.",
    input: "Photo + what to remove",
    output: "A clean photo",
    prompt:
      "Remove the bags and cables next to the wall. Keep the floor and shadows as natural as possible.",
    beforeSrc: "/artwork/ai-tool-item_removal-before.webp",
    afterSrc: "/artwork/ai-tool-item_removal-after.webp",
  },
  day_to_dusk: {
    icon: Sun,
    benefit:
      "Turn a daytime shot into an evening mood that makes a warmer first impression.",
    input: "Photo + mood",
    output: "A dusk or night shot",
    prompt:
      "Subtle blue hour, warm light in the windows, keep the facade color unchanged.",
    beforeSrc: "/artwork/ai-tool-day_to_dusk-before.webp",
    afterSrc: "/artwork/ai-tool-day_to_dusk-after.webp",
  },
  sky_replacement: {
    icon: CloudSun,
    benefit:
      "Keep a good shot, but swap a grey or blown-out sky for a better mood.",
    input: "Exterior with visible sky",
    output: "A photo with a better sky",
    prompt:
      "Lightly clouded sky, keep the building color and facade exposure unchanged.",
    beforeSrc: "/artwork/ai-tool-sky_replacement-before.webp",
    afterSrc: "/artwork/ai-tool-sky_replacement-after.webp",
  },
  wall_color_change: {
    icon: Paintbrush,
    benefit:
      "Test a new wall color before you actually repaint the space.",
    input: "Photo + target color",
    output: "A new wall color",
    prompt:
      "Change only the wall behind the bed. The ceiling, trim and furniture stay the same.",
    beforeSrc: "/artwork/ai-tool-wall_color_change-before.webp",
    afterSrc: "/artwork/ai-tool-wall_color_change-after.webp",
  },
  virtual_staging: {
    icon: Sofa,
    benefit:
      "Turn an empty space into a room buyers immediately understand and connect with.",
    input: "Photo + room type + style",
    output: "A furnished space",
    prompt:
      "Living room, warm modern style, neutral palette, wood and light textiles.",
    beforeSrc: "/artwork/ai-tool-virtual_staging-before.webp",
    afterSrc: "/artwork/ai-tool-virtual_staging-after.webp",
  },
  object_insertion: {
    icon: Armchair,
    benefit:
      "Add a specific piece of furniture or decor, or replace an existing piece using several angles of the same model.",
    input: "Interior + up to 5 angles of the piece",
    output: "The piece added or replaced",
    prompt:
      "Replace the existing armchair with the reference model. Keep the scale, light and shadow on the floor.",
    beforeSrc: "/artwork/ai-tool-object_insertion-before.webp",
    afterSrc: "/artwork/ai-tool-object_insertion-after.webp",
  },
  virtual_renovation: {
    icon: Wand2,
    benefit:
      "Show renovation potential before expensive decisions on materials and works.",
    input: "Photo + what to change + style",
    output: "A renovated variant",
    prompt:
      "Replace the floor with oak parquet, walls in warm white, keep the kitchen layout.",
    beforeSrc: "/artwork/ai-tool-virtual_renovation-before.webp",
    afterSrc: "/artwork/ai-tool-virtual_renovation-after.webp",
  },
  room_redesign: {
    icon: Palette,
    benefit:
      "Change the style and mood of an existing room without a full 3D project.",
    input: "Photo + room type + style",
    output: "A new design variant",
    prompt:
      "Light Scandinavian style, less visual clutter, keep the windows and the basic layout.",
    beforeSrc: "/artwork/ai-tool-room_redesign-before.webp",
    afterSrc: "/artwork/ai-tool-room_redesign-after.webp",
  },
};

const workflow = [
  {
    icon: Upload,
    title: "Upload a photo",
    text: "JPG, PNG or WebP up to 50 MB. Clear, wide shots work best.",
  },
  {
    icon: Sparkles,
    title: "Pick an AI tool",
    text: "From quick corrections to staging, furniture and decor replacement, renovation and redesign.",
  },
  {
    icon: Brush,
    title: "Add instructions",
    text: "Write what to change, what to keep, and mark a mask if needed.",
  },
  {
    icon: ImageIcon,
    title: "Download the result",
    text: "Download the result or use it as a new input image.",
  },
];

const heroProof = {
  beforeSrc: "/artwork/ai-tool-virtual_staging-before.webp",
  afterSrc: AI_STUDIO_OG_IMAGE,
  title: "An empty space into a sales-ready shot",
  text: "A before/after example from the AI Studio virtual staging tool.",
};

const trustSignals = [
  "A failed edit returns your credits",
  `${AI_FREE_REGENERATIONS} free retry of the same edit type`,
  `Files are stored for ${AI_FILE_RETENTION_DAYS} days`,
  `Invoices issued by ${IMPRINT.shortName}`,
];

const scenarios = [
  {
    title: "Clean up the photo",
    text:
      "Remove clutter, vehicles, people or small distractions. The space looks listing-ready without physical intervention.",
    bestFor: "Agents, property owners, photographers",
    image: "/artwork/elegant-render-services-before-after-grid.webp",
  },
  {
    title: "Furnish an empty space",
    text:
      "Add furniture, decor and atmosphere in a chosen style so buyers immediately understand the room's purpose.",
    bestFor: "Agencies, investors, owners who are selling",
    image: "/artwork/elegant-render-virtual-staging-scene.webp",
  },
  {
    title: "Show renovation potential",
    text:
      "Test floors, walls, materials and mood before you make expensive decisions.",
    bestFor: "Investors, designers, owners who are renovating",
    image: "/artwork/pricing-card-staging-renovation.webp",
  },
];

const tips = [
  "Upload a clear photo; the better the resolution, the better the result.",
  "Write what must stay the same: windows, layout, floor, materials.",
  "Do not ask for several unrelated things in one sentence.",
  "For staging, state the room's purpose, style and color palette.",
  "For adding or replacing furniture or decor, upload up to 5 angles of the same piece; for a replacement, mark the existing piece with a mask.",
  "For renovation, separate materials, furniture and lighting.",
  "For removing larger objects, use a mask in Advanced mode.",
  "If the result is close, use it as a new input and ask for a small correction.",
];

const creditPackages = [10, 25, 50, 100];

const MOBILE_LABEL_BY_TOOL: Record<AiEditType, string> = {
  item_removal: "Item removal",
  day_to_dusk: "Day to dusk",
  sky_replacement: "Sky",
  wall_color_change: "Wall color",
  virtual_staging: "Staging",
  object_insertion: "Furniture/decor",
  virtual_renovation: "Renovation",
  room_redesign: "Redesign",
};

/**
 * Lowest-tier single-purchase starting price for a tool, stored internally
 * in EUR because AI credits and checkout are EUR-only.
 */
function toolStartingEur(
  units: number,
  tiers: AiCreditTier[],
  unitsPerCredit: number,
): number {
  const sorted = [...tiers].sort((a, b) => b.minCredits - a.minCredits);
  const lowestTier = sorted[sorted.length - 1];
  const rsdPerCredit = lowestTier.centsPerCredit / 100;
  return (units / unitsPerCredit) * rsdPerCredit;
}

function publicTaxNote(displayCurrency: DisplayCurrency): string {
  return `Prices are shown in ${displayCurrency}, VAT included.`;
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
            name: "AI Studio for real estate photo editing",
            description:
              "AI tools for item removal, day-to-dusk, sky replacement, virtual staging, furniture and decor insertion or replacement, renovation and room redesign.",
          }),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "AI Studio", path: "/ai-studio" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "AI Studio",
            serviceType: "AI real estate photo editing",
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
                "AI Studio shows how an empty interior photo becomes a sales-ready visual through virtual staging.",
              inLanguage: SEO.htmlLang,
            },
            offers: {
              "@type": "OfferCatalog",
              name: "AI tools",
              itemListElement: AI_EDIT_TYPES.map((item) => ({
                "@type": "Offer",
                name: item.label,
                description: toolDetails[item.id].benefit,
                priceCurrency: "EUR",
                price: toolStartingEur(
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
    toolStartingEur(
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
        <p className="section-kicker">AI Studio</p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-[1.08] text-foreground sm:text-5xl 2xl:text-6xl">
          AI editing that turns your photo into a sales-ready visual
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Upload a photo, pick a tool and get a finished visual for a listing,
          a presentation or a quick idea check. Eight tools, from{" "}
          {simpleStarting} per edit.
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
          <CreditCheckoutButton label="Buy credits and start" />
          <ButtonLink href="/portal/ai-studio" variant="outline" size="lg">
            Open AI Studio
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

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80">
        <BeforeAfterReveal
          beforeSrc={heroProof.beforeSrc}
          afterSrc={heroProof.afterSrc}
          alt={AI_STUDIO_IMAGE_ALT}
          beforeAlt="AI Studio - an empty room before virtual staging"
          afterAlt={AI_STUDIO_IMAGE_ALT}
          sizes="(max-width: 768px) 100vw, 36vw"
          className="aspect-[4/3] bg-secondary"
          autoDemoIntervalMs={7000}
        >
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-foreground/60 px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-[0.08em] text-background/95">
            Before / after
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
      <h2 className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        What do you want to do?
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
        {AI_EDIT_TYPES.map((item) => {
          const detail = toolDetails[item.id];
          const startingEur = toolStartingEur(
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
              creditsLabel={formatCreditsFromUnits(
                item.units,
                pricingSettings.aiCreditUnitsPerCredit,
              )}
              startingRsdLabel={formatPublicPrice(
                startingEur,
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
          <p className="section-kicker">How it works</p>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            From photo to usable visual in four steps.
          </h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflow.map((item, index) => (
            <article
              key={item.title}
              className="rounded-2xl border border-border/70 bg-card/80 p-6"
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
            <p className="section-kicker">Tools</p>
            <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
              Eight AI edits for existing photos.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              Every tool has a clear scope: from quick photo clean-up to
              staging, furniture and decor insertion or replacement, renovation
              and room redesign. The example prompt under each tool shows how
              to phrase your instruction.
            </p>
          </div>
          <Link
            href="/portal/ai-studio"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
          >
            Try it in the portal
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {AI_EDIT_TYPES.map((item) => {
            const detail = toolDetails[item.id];
            const Icon = detail.icon;
            const capabilities = [
              item.supportsMask !== false ? "Mask" : null,
              item.supportsStyles ? "Style" : null,
              item.supportsColor ? "Color" : null,
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
                    <span className="rounded-full bg-secondary px-2 py-1 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {item.complexity === "simple" ? "Simple" : "Complex"} ·{" "}
                      {formatCreditsFromUnits(
                        item.units,
                        pricingSettings.aiCreditUnitsPerCredit,
                      )}
                    </span>
                    {capabilities.length > 0 && (
                      <span className="rounded-full bg-secondary px-2 py-1 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
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
                  &ldquo;{detail.prompt}&rdquo;
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
          <p className="section-kicker">Scenarios</p>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            The three most common reasons for AI editing.
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
                alt={`${item.title} - an AI Studio use case`}
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
                <p className="mt-4 font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Best for: {item.bestFor}
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
          <p className="section-kicker">When to use which</p>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            AI Studio or a classic render?
          </h2>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <ComparisonCard
            icon={Sparkles}
            title="AI Studio"
            text="Fast editing of an existing photo. Ideal when you already have the shot and need a visual correction or improvement."
            items={[
              "You already have a photo of the space",
              "You need a quick visual check or to test an idea",
              "You need a stronger property listing",
              "You need an existing image cleaned up or styled",
              `Price: from ${formatPublicPrice(
                toolStartingEur(
                  1,
                  pricingSettings.aiCreditTiers,
                  pricingSettings.aiCreditUnitsPerCredit,
                ),
                displayCurrency,
                pricingSettings,
              )} per simple edit`,
            ]}
            accent
          />
          <ComparisonCard
            icon={Layers3}
            title="Classic render"
            text="A hand-built 3D visual with full control over architecture, materials and camera angles."
            items={[
              "The space does not exist yet",
              "You need accurate architecture and dimensions",
              "You need several controlled shots of the same scene",
              "You need production-level detail",
              "You need a complete sales campaign",
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
          See rendering services
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
          <p className="section-kicker">Credits</p>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            Buy as many as you need.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Credits stay valid for {pricingSettings.aiCreditExpiresAfterMonths} months
            from your last top-up. Larger packages have a lower price per
            credit, and the system automatically applies the best rate for
            your chosen quantity. {publicTaxNote(displayCurrency)}
          </p>
          <div className="mt-5 grid gap-2 text-sm text-foreground/82">
            <span className="inline-flex items-center gap-2">
              <Coins className="h-4 w-4 text-accent" />
              Simple edit = 0.5 credits
            </span>
            <span className="inline-flex items-center gap-2">
              <Coins className="h-4 w-4 text-accent" />
              Complex edit = 1 credit
            </span>
          </div>
          <CreditCheckoutButton className="mt-7" label="Buy credits" />
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
                  <p className="text-sm text-muted-foreground">credits</p>
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
                    per credit
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
                  /credit
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
          <p className="section-kicker">Tips</p>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            For a better result, tell the AI what should stay the same.
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
          <p className="section-kicker">FAQ</p>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            Everything you need to know before your first edit.
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
      <div className="mx-auto flex w-full max-w-[min(96vw,1720px)] flex-col items-start justify-between gap-6 rounded-2xl bg-foreground p-6 text-background md:flex-row md:items-center md:p-10">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-white/60">
            AI Studio
          </p>
          <h2 className="mt-2 text-3xl leading-tight md:text-4xl">
            Ready for your first photo edit?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-background/72">
            Start with one clear photo. If you are not sure which tool is
            right, start from the goal: clean up, furnish, renovate or change
            the mood.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CreditCheckoutButton label="Buy credits and start" />
          <ButtonLink
            href="/portal/ai-studio"
            variant="outline"
            size="lg"
            className="border-background/30 text-background hover:bg-background/10"
          >
            Open AI Studio
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
