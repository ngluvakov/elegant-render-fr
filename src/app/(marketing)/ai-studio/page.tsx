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
  "AI Studio - exemple de home staging virtuel d’un espace vide pour une annonce immobilière";

export const metadata: Metadata = createPublicMetadata({
  title: "AI Studio",
  description:
    "Retouche IA rapide pour photos immobilières : suppression d’objets, jour au crépuscule, remplacement du ciel, changement de couleur des murs, home staging virtuel, ajout ou remplacement de meubles et de déco, rénovation et redesign.",
  path: "/ai-studio",
  image: AI_STUDIO_OG_IMAGE,
  imageAlt: AI_STUDIO_IMAGE_ALT,
  keywords: [
    "retouche photo immobilière IA",
    "home staging virtuel IA",
    "suppression d’objets IA",
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
      "Débarrassez la photo du désordre, des personnes, des véhicules ou des petites distractions avant la mise en ligne de l’annonce.",
    input: "Photo + ce qu’il faut supprimer",
    output: "Une photo propre",
    prompt:
      "Supprimez les sacs et les câbles le long du mur. Gardez le sol et les ombres aussi naturels que possible.",
    beforeSrc: "/artwork/ai-tool-item_removal-before.webp",
    afterSrc: "/artwork/ai-tool-item_removal-after.webp",
  },
  day_to_dusk: {
    icon: Sun,
    benefit:
      "Transformez une photo de jour en ambiance de soirée pour une première impression plus chaleureuse.",
    input: "Photo + ambiance",
    output: "Une photo au crépuscule ou de nuit",
    prompt:
      "Heure bleue subtile, lumière chaude aux fenêtres, couleur de la façade inchangée.",
    beforeSrc: "/artwork/ai-tool-day_to_dusk-before.webp",
    afterSrc: "/artwork/ai-tool-day_to_dusk-after.webp",
  },
  sky_replacement: {
    icon: CloudSun,
    benefit:
      "Gardez une bonne photo, mais remplacez un ciel gris ou surexposé par une ambiance plus flatteuse.",
    input: "Extérieur avec ciel visible",
    output: "Une photo avec un meilleur ciel",
    prompt:
      "Ciel légèrement nuageux, couleur du bâtiment et exposition de la façade inchangées.",
    beforeSrc: "/artwork/ai-tool-sky_replacement-before.webp",
    afterSrc: "/artwork/ai-tool-sky_replacement-after.webp",
  },
  wall_color_change: {
    icon: Paintbrush,
    benefit:
      "Testez une nouvelle couleur de mur avant de repeindre réellement l’espace.",
    input: "Photo + couleur souhaitée",
    output: "Une nouvelle couleur de mur",
    prompt:
      "Changez uniquement le mur derrière le lit. Le plafond, les moulures et le mobilier restent identiques.",
    beforeSrc: "/artwork/ai-tool-wall_color_change-before.webp",
    afterSrc: "/artwork/ai-tool-wall_color_change-after.webp",
  },
  virtual_staging: {
    icon: Sofa,
    benefit:
      "Transformez un espace vide en une pièce que les acheteurs comprennent et s’approprient immédiatement.",
    input: "Photo + type de pièce + style",
    output: "Un espace meublé",
    prompt:
      "Salon, style moderne chaleureux, palette neutre, bois et textiles clairs.",
    beforeSrc: "/artwork/ai-tool-virtual_staging-before.webp",
    afterSrc: "/artwork/ai-tool-virtual_staging-after.webp",
  },
  object_insertion: {
    icon: Armchair,
    benefit:
      "Ajoutez un meuble ou un objet déco précis, ou remplacez une pièce existante à partir de plusieurs angles du même modèle.",
    input: "Intérieur + jusqu’à 5 angles de l’objet",
    output: "L’objet ajouté ou remplacé",
    prompt:
      "Remplacez le fauteuil existant par le modèle de référence. Conservez l’échelle, la lumière et l’ombre au sol.",
    beforeSrc: "/artwork/ai-tool-object_insertion-before.webp",
    afterSrc: "/artwork/ai-tool-object_insertion-after.webp",
  },
  virtual_renovation: {
    icon: Wand2,
    benefit:
      "Montrez le potentiel de rénovation avant les décisions coûteuses sur les matériaux et les travaux.",
    input: "Photo + ce qu’il faut changer + style",
    output: "Une variante rénovée",
    prompt:
      "Remplacez le sol par du parquet en chêne, murs en blanc chaud, conservez l’agencement de la cuisine.",
    beforeSrc: "/artwork/ai-tool-virtual_renovation-before.webp",
    afterSrc: "/artwork/ai-tool-virtual_renovation-after.webp",
  },
  room_redesign: {
    icon: Palette,
    benefit:
      "Changez le style et l’ambiance d’une pièce existante sans projet 3D complet.",
    input: "Photo + type de pièce + style",
    output: "Une nouvelle variante de design",
    prompt:
      "Style scandinave clair, moins de surcharge visuelle, conservez les fenêtres et l’agencement de base.",
    beforeSrc: "/artwork/ai-tool-room_redesign-before.webp",
    afterSrc: "/artwork/ai-tool-room_redesign-after.webp",
  },
};

const workflow = [
  {
    icon: Upload,
    title: "Importez une photo",
    text: "JPG, PNG ou WebP jusqu’à 50 Mo. Les photos nettes et larges donnent les meilleurs résultats.",
  },
  {
    icon: Sparkles,
    title: "Choisissez un outil IA",
    text: "Des corrections rapides au staging, en passant par le remplacement de meubles et de déco, la rénovation et le redesign.",
  },
  {
    icon: Brush,
    title: "Ajoutez vos consignes",
    text: "Écrivez ce qu’il faut changer, ce qu’il faut garder, et tracez un masque si nécessaire.",
  },
  {
    icon: ImageIcon,
    title: "Téléchargez le résultat",
    text: "Téléchargez le résultat ou utilisez-le comme nouvelle image de départ.",
  },
];

const heroProof = {
  beforeSrc: "/artwork/ai-tool-virtual_staging-before.webp",
  afterSrc: AI_STUDIO_OG_IMAGE,
  title: "D’un espace vide à une photo prête à vendre",
  text: "Un exemple avant/après de l’outil de home staging virtuel d’AI Studio.",
};

const trustSignals = [
  "Une retouche échouée vous rend vos crédits",
  `${AI_FREE_REGENERATIONS} nouvel essai gratuit du même type de retouche`,
  `Les fichiers sont conservés ${AI_FILE_RETENTION_DAYS} jours`,
  `Factures émises par ${IMPRINT.shortName}`,
];

const scenarios = [
  {
    title: "Nettoyer la photo",
    text:
      "Supprimez le désordre, les véhicules, les personnes ou les petites distractions. L’espace paraît prêt pour l’annonce, sans intervention physique.",
    bestFor: "Agents immobiliers, propriétaires, photographes",
    image: "/artwork/elegant-render-services-before-after-grid.webp",
  },
  {
    title: "Meubler un espace vide",
    text:
      "Ajoutez meubles, déco et atmosphère dans le style choisi pour que les acheteurs comprennent immédiatement la fonction de la pièce.",
    bestFor: "Agences, investisseurs, propriétaires qui vendent",
    image: "/artwork/elegant-render-virtual-staging-scene.webp",
  },
  {
    title: "Montrer le potentiel de rénovation",
    text:
      "Testez sols, murs, matériaux et ambiance avant de prendre des décisions coûteuses.",
    bestFor: "Investisseurs, designers, propriétaires qui rénovent",
    image: "/artwork/pricing-card-staging-renovation.webp",
  },
];

const tips = [
  "Importez une photo nette ; plus la résolution est bonne, meilleur est le résultat.",
  "Écrivez ce qui doit rester identique : fenêtres, agencement, sol, matériaux.",
  "Ne demandez pas plusieurs choses sans rapport dans une même phrase.",
  "Pour le staging, précisez la fonction de la pièce, le style et la palette de couleurs.",
  "Pour ajouter ou remplacer un meuble ou un objet déco, importez jusqu’à 5 angles du même objet ; pour un remplacement, marquez l’objet existant avec un masque.",
  "Pour la rénovation, séparez matériaux, mobilier et éclairage.",
  "Pour supprimer des objets plus grands, utilisez un masque en mode Avancé.",
  "Si le résultat est proche, utilisez-le comme nouvelle image de départ et demandez une petite correction.",
];

const creditPackages = [10, 25, 50, 100];

const MOBILE_LABEL_BY_TOOL: Record<AiEditType, string> = {
  item_removal: "Suppression",
  day_to_dusk: "Crépuscule",
  sky_replacement: "Ciel",
  wall_color_change: "Couleur murs",
  virtual_staging: "Staging",
  object_insertion: "Meubles/déco",
  virtual_renovation: "Rénovation",
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
  return `Prix affichés en ${displayCurrency}, TVA incluse.`;
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
            name: "AI Studio pour la retouche photo immobilière",
            description:
              "Outils IA pour la suppression d’objets, le jour au crépuscule, le remplacement du ciel, le home staging virtuel, l’ajout ou le remplacement de meubles et de déco, la rénovation et le redesign de pièces.",
          }),
          buildBreadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "AI Studio", path: "/ai-studio" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "AI Studio",
            serviceType: "Retouche photo immobilière par IA",
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
                "AI Studio montre comment la photo d’un intérieur vide devient un visuel prêt à vendre grâce au home staging virtuel.",
              inLanguage: SEO.htmlLang,
            },
            offers: {
              "@type": "OfferCatalog",
              name: "Outils IA",
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
          La retouche IA qui transforme votre photo en visuel prêt à vendre
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Importez une photo, choisissez un outil et obtenez un visuel fini
          pour une annonce, une présentation ou une vérification rapide
          d’idée. Huit outils, à partir de {simpleStarting} par retouche.
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-xs text-foreground/82">
          <span className="rounded-full bg-secondary px-3 py-1">
            Simple ={" "}
            {formatCreditsFromUnits(
              1,
              pricingSettings.aiCreditUnitsPerCredit,
            )}{" "}
            · Complexe ={" "}
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
          <CreditCheckoutButton label="Acheter des crédits et commencer" />
          <ButtonLink href="/portal/ai-studio" variant="outline" size="lg">
            Ouvrir AI Studio
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
          beforeAlt="AI Studio - une pièce vide avant home staging virtuel"
          afterAlt={AI_STUDIO_IMAGE_ALT}
          sizes="(max-width: 768px) 100vw, 36vw"
          className="aspect-[4/3] bg-secondary"
          autoDemoIntervalMs={7000}
        >
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-foreground/60 px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-[0.08em] text-background/95">
            Avant / après
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
 * from /tarifs: each card shows the tool's starting public price and links straight
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
        Que voulez-vous faire ?
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
          <p className="section-kicker">Comment ça marche</p>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            De la photo au visuel exploitable en quatre étapes.
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
            <p className="section-kicker">Outils</p>
            <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
              Huit retouches IA pour vos photos existantes.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              Chaque outil a un périmètre clair : du simple nettoyage de photo
              au staging, à l’ajout ou au remplacement de meubles et de déco,
              à la rénovation et au redesign de pièces. L’exemple de consigne
              sous chaque outil montre comment formuler votre demande.
            </p>
          </div>
          <Link
            href="/portal/ai-studio"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
          >
            Essayer dans l’espace client
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {AI_EDIT_TYPES.map((item) => {
            const detail = toolDetails[item.id];
            const Icon = detail.icon;
            const capabilities = [
              item.supportsMask !== false ? "Masque" : null,
              item.supportsStyles ? "Style" : null,
              item.supportsColor ? "Couleur" : null,
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
                      {item.complexity === "simple" ? "Simple" : "Complexe"} ·{" "}
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
                      Entrée :
                    </strong>{" "}
                    {detail.input}
                  </p>
                  <p>
                    <strong className="font-semibold text-foreground">
                      Résultat :
                    </strong>{" "}
                    {detail.output}
                  </p>
                </div>

                <p className="mt-4 rounded-xl bg-secondary/50 px-3 py-2 text-xs leading-relaxed text-foreground/78">
                  « {detail.prompt} »
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
          <p className="section-kicker">Scénarios</p>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            Les trois raisons les plus courantes de recourir à la retouche IA.
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
                alt={`${item.title} - un cas d’usage AI Studio`}
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
                  Idéal pour : {item.bestFor}
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
          <p className="section-kicker">Lequel choisir</p>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            AI Studio ou rendu classique ?
          </h2>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <ComparisonCard
            icon={Sparkles}
            title="AI Studio"
            text="Retouche rapide d’une photo existante. Idéal quand vous avez déjà la photo et qu’il lui faut une correction ou une amélioration visuelle."
            items={[
              "Vous avez déjà une photo de l’espace",
              "Vous voulez une vérification visuelle rapide ou tester une idée",
              "Vous voulez une annonce immobilière plus convaincante",
              "Vous voulez nettoyer ou styliser une image existante",
              `Prix : à partir de ${formatPublicPrice(
                toolStartingEur(
                  1,
                  pricingSettings.aiCreditTiers,
                  pricingSettings.aiCreditUnitsPerCredit,
                ),
                displayCurrency,
                pricingSettings,
              )} par retouche simple`,
            ]}
            accent
          />
          <ComparisonCard
            icon={Layers3}
            title="Rendu classique"
            text="Un visuel 3D construit à la main, avec un contrôle total de l’architecture, des matériaux et des angles de caméra."
            items={[
              "L’espace n’existe pas encore",
              "Vous avez besoin d’une architecture et de dimensions exactes",
              "Vous avez besoin de plusieurs vues maîtrisées de la même scène",
              "Vous avez besoin d’un niveau de détail professionnel",
              "Vous avez besoin d’une campagne de vente complète",
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
          Voir les services de rendu
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
          <p className="section-kicker">Crédits</p>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            Achetez-en autant que nécessaire.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Les crédits restent valables {pricingSettings.aiCreditExpiresAfterMonths} mois
            après votre dernier rechargement. Les packs plus grands ont un
            prix par crédit plus bas, et le système applique automatiquement
            le meilleur tarif pour la quantité choisie. {publicTaxNote(displayCurrency)}
          </p>
          <div className="mt-5 grid gap-2 text-sm text-foreground/82">
            <span className="inline-flex items-center gap-2">
              <Coins className="h-4 w-4 text-accent" />
              Retouche simple = 0,5 crédit
            </span>
            <span className="inline-flex items-center gap-2">
              <Coins className="h-4 w-4 text-accent" />
              Retouche complexe = 1 crédit
            </span>
          </div>
          <CreditCheckoutButton className="mt-7" label="Acheter des crédits" />
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
                  <p className="text-sm text-muted-foreground">crédits</p>
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
                    par crédit
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
                  /crédit
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
          <p className="section-kicker">Conseils</p>
          <h2 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl">
            Pour un meilleur résultat, dites à l’IA ce qui doit rester
            identique.
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
            Tout ce qu’il faut savoir avant votre première retouche.
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
            Prêt pour votre première retouche photo ?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-background/72">
            Commencez avec une photo nette. Si vous hésitez sur l’outil,
            partez de l’objectif : nettoyer, meubler, rénover ou changer
            l’ambiance.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CreditCheckoutButton label="Acheter des crédits et commencer" />
          <ButtonLink
            href="/portal/ai-studio"
            variant="outline"
            size="lg"
            className="border-background/30 text-background hover:bg-background/10"
          >
            Ouvrir AI Studio
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
