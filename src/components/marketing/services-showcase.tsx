/**
 * ServicesShowcase — Services page with filterable cards, scenario guide,
 * process steps, and FAQ.
 *
 * Used on: /services (services page).
 */
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Home as HomeIcon,
  ImageIcon,
  LayoutGrid,
  ScanSearch,
  Send,
  Sparkles,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button-link";
import { QuickInquiryLink } from "@/components/inquiry/quick-inquiry-link";
import { BeforeAfterReveal } from "@/components/marketing/before-after-reveal";
import {
  usePublicCurrency,
  usePublicPricingSettings,
} from "@/components/site/public-currency-provider";
import {
  formatPublicPrice,
  formatPublicPriceText,
} from "@/lib/catalog/display-currency";
import { SERVICES_PAGE_FAQS } from "@/lib/content/site";

// ─── Assets ──────────────────────────────────────────────

const ARTWORK = {
  hero: "/artwork/elegant-render-hero-interior.webp",
  exterior: "/artwork/elegant-render-feature-exterior.webp",
  floorplan: "/artwork/elegant-render-floorplan-3d.webp",
  staging: "/artwork/elegant-render-virtual-staging-scene.webp",
  triptych1: "/artwork/elegant-render-services-triptych-1.webp",
  triptych2: "/artwork/elegant-render-services-triptych-2.webp",
  triptych3: "/artwork/elegant-render-services-triptych-3.webp",
  triptych4: "/artwork/elegant-render-services-triptych-4.webp",
};

const KUULA_EMBED =
  "https://kuula.co/share/collection/71kZD?logo=0&info=0&fs=1&vr=0&sd=0&autorotate=0.14&autop=5&thumbs=0";

// ─── Types ───────────────────────────────────────────────

type FilterKey = "sve" | "renderi" | "osnove" | "360" | "nekretnine";

type Service = {
  name: string;
  slug: string;
  priceEur: number;
  category: Exclude<FilterKey, "sve">;
  short: string;
  audience: string;
  includes: string[];
  icon: string;
  badge: string;
  imageSrc: string;
  imagePosition: string;
  /** When set, render a small mouse-tracked before/after reveal (uses
   *  BeforeAfterReveal — same as AI Studio tool picker). Used for the 6
   *  transformation cards so the customer sees the value at a glance. */
  beforeSrc?: string;
  afterSrc?: string;
  /** When set, render an autoplay-loop <video> instead of the image
   *  (animation card). */
  videoSrc?: string;
  /** When set, render an iframe inside the card (Kuula 360 panorama).
   *  Replaces the old is360Embed boolean — each card carries its own URL
   *  now so different 360 cards can point at different collections. */
  embedSrc?: string;
  /** Surface the "Before / after" pill in the corner. Used for the 6 pair
   *  cards (matches beforeSrc/afterSrc) but also leaves room for static
   *  cards that want the pill without the reveal. */
  isCompare?: boolean;
};

// ─── Data ────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  home: HomeIcon,
  building: Building2,
  sparkles: Sparkles,
  plans: LayoutGrid,
  video: Video,
  scan: ScanSearch,
  image: ImageIcon,
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "sve", label: "All services" },
  { key: "renderi", label: "Renders" },
  { key: "osnove", label: "Floor plans" },
  { key: "360", label: "360° and animations" },
  { key: "nekretnine", label: "For property sales" },
];

const SERVICES: Service[] = [
  {
    name: "Interior renders",
    slug: "interior-render",
    priceEur: 170,
    category: "renderi",
    short: "Interior visualization before furnishing, renovation, or sale.",
    audience: "For apartment owners, architects, designers, and smaller investors.",
    includes: ["10 static renders + floor plan", "3D floor plan included", "3 revision rounds"],
    icon: "home",
    badge: "Most requested",
    imageSrc: "/artwork/listing-interior-static.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "360° interiors",
    slug: "interior-360-tour",
    priceEur: 295,
    category: "360",
    short: "An interactive 360° tour of the space with additional static camera angles.",
    audience: "For presenting apartments, villas, showrooms, and hospitality spaces.",
    includes: [
      "10 interactive rooms in a 360° tour",
      "10 static camera angles",
      "Floor plan included",
    ],
    icon: "video",
    badge: "Interactive",
    imageSrc: "",
    imagePosition: "50% 50%",
    embedSrc: KUULA_EMBED,
  },
  {
    name: "Exterior renders",
    slug: "exterior-renders",
    priceEur: 250,
    category: "renderi",
    short: "A realistic view of a house, building, or facade with materials and surroundings.",
    audience: "For private houses, smaller residential projects, and architectural presentations.",
    includes: ["First view included", "Model and lighting scene", "Additional angles at a lower price"],
    icon: "building",
    badge: "Exterior",
    imageSrc: "/artwork/listing-exterior-static.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "360° exteriors",
    slug: "exterior-360",
    priceEur: 335,
    category: "360",
    short: "A VR-ready exterior view with interactive viewpoints.",
    audience: "For marketing the sale of houses, villas, and smaller developments.",
    includes: [
      "1 interactive viewpoint included",
      "Full 3D model of the building",
      "Additional viewpoints per project",
    ],
    icon: "video",
    badge: "VR ready",
    imageSrc: "/artwork/listing-exterior-360.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "3D streetscape",
    slug: "3d-streetscape",
    priceEur: 420,
    category: "renderi",
    short: "Your building with the neighboring houses, modeled in 3D — viewed from the street (and from the air if needed).",
    audience: "For buildings where the street, neighborhood, and plot context matters.",
    includes: [
      "Full 3D model of the building + surroundings",
      "First view included",
      "Any angle (street or aerial)",
    ],
    icon: "scan",
    badge: "Streetscape",
    imageSrc: "/artwork/listing-streetscape.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "Landscape design",
    slug: "landscape-design",
    priceEur: 220,
    category: "renderi",
    short: "A view of a yard, garden, park, or outdoor design with vegetation and terrain.",
    audience: "For private houses, villas, and projects where the outdoor setting matters.",
    includes: ["Terrain model", "Vegetation and planting", "First view included"],
    icon: "image",
    badge: "Outdoor setting",
    imageSrc: "/artwork/listing-landscape-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-landscape-before.webp",
    afterSrc: "/artwork/listing-landscape-after.webp",
    isCompare: true,
  },
  {
    name: "Photomontage",
    slug: "photomontage",
    priceEur: 300,
    category: "renderi",
    short: "Your future building blended into a real photo of the site — with the true surroundings and light.",
    audience: "For permits, public hearings, and presentations where site accuracy matters.",
    includes: ["Site analysis", "Perspective matching", "Final composite"],
    icon: "image",
    badge: "Real location",
    imageSrc: "/artwork/listing-photomontage-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-photomontage-before.webp",
    afterSrc: "/artwork/listing-photomontage-after.webp",
    isCompare: true,
  },
  {
    name: "3D floor plans",
    slug: "3d-floor-plans",
    priceEur: 29,
    category: "osnove",
    short: "A top-down 3D view of the room layout, furniture, and functional organization.",
    audience: "For listings, apartment presentations, and easier understanding of the layout.",
    includes: ["Complete layout", "Room labels", "Furnished version available"],
    icon: "plans",
    badge: "Clear layout",
    imageSrc: "/artwork/listing-3d-floor-plans.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "2D floor plans",
    slug: "2d-floor-plans",
    priceEur: 20,
    category: "osnove",
    short: "Clean, easy-to-read 2D floor plans for marketing materials, websites, and listings.",
    audience: "For agents, apartment owners, and property sales presentations.",
    includes: ["Colored floor plan", "Room names", "Style and furniture variants"],
    icon: "plans",
    badge: "2D view",
    imageSrc: "/artwork/listing-floorplan-2d.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "3D site plans",
    slug: "site-plans",
    priceEur: 350,
    category: "osnove",
    short: "An overview of the entire plot with buildings, access routes, greenery, and the wider spatial context.",
    audience: "For houses, villas, smaller complexes, and project sales brochures.",
    includes: ["Plot and buildings", "Access areas", "Seasonal variants available"],
    icon: "plans",
    badge: "Plot and context",
    imageSrc: "/artwork/listing-siteplan.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "Architectural animation",
    slug: "architectural-animation",
    priceEur: 225,
    category: "360",
    short: "Walkthrough and flythrough video for a stronger sales impression.",
    audience: "For projects where a static view is not enough to show the space.",
    includes: ["15 seconds minimum", "Priced per second", "Discounts for longer durations"],
    icon: "video",
    badge: "Video",
    imageSrc: "",
    imagePosition: "50% 50%",
    videoSrc: "/artwork/listing-animation.mp4",
  },
  {
    name: "VR tour",
    slug: "vr-tour",
    priceEur: 20,
    category: "360",
    short: "Web-based tours that link 360° views into an interactive experience.",
    audience: "For advertising, property presentations, and remote sales.",
    includes: ["Tour assembly", "Navigation through the space", "Branded version on request"],
    icon: "video",
    badge: "Web experience",
    imageSrc: "",
    imagePosition: "50% 50%",
    embedSrc:
      "https://kuula.co/share/collection/7kLnB?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
  },
  {
    name: "Virtual staging",
    slug: "virtual-staging",
    priceEur: 18,
    category: "nekretnine",
    short: "Digital furnishing of an empty room based on an existing photo.",
    audience: "For property owners, agents, and investors who want a better listing.",
    includes: ["First styled image", "Additional angles per room", "Better rates for multiple rooms"],
    icon: "sparkles",
    badge: "Before and after",
    imageSrc: "/artwork/listing-staging-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-staging-before.webp",
    afterSrc: "/artwork/listing-staging-after.webp",
    isCompare: true,
  },
  {
    name: "Virtual renovation",
    slug: "virtual-renovation",
    priceEur: 66,
    category: "nekretnine",
    short: "A view of how the space would look after renovation and new materials.",
    audience: "For property buyers, owners, and designers who want a clear before-and-after scenario.",
    includes: ["New look proposal", "Materials and finishes", "Multiple angles or rooms"],
    icon: "sparkles",
    badge: "Before and after",
    imageSrc: "/artwork/listing-renovation-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-renovation-before.webp",
    afterSrc: "/artwork/listing-renovation-after.webp",
    isCompare: true,
  },
  {
    name: "Day-to-dusk",
    slug: "day-to-dusk",
    priceEur: 10,
    category: "nekretnine",
    short: "Turning a daytime exterior photo into a more striking dusk scene.",
    audience: "For listings that need a stronger first impression.",
    includes: ["Sky replacement", "Color and light grading", "Volume discount for multiple images"],
    icon: "image",
    badge: "Before and after",
    imageSrc: "/artwork/listing-day-to-dusk-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-day-to-dusk-before.webp",
    afterSrc: "/artwork/listing-day-to-dusk-after.webp",
    isCompare: true,
  },
  {
    name: "Item removal",
    slug: "item-removal",
    priceEur: 12,
    category: "nekretnine",
    short: "Digital removal of clutter and unwanted objects from a photo of the space.",
    audience: "For preparing a property for listing, rental, or presentation.",
    includes: ["Frame cleanup", "Background reconstruction", "Simple and complex edits"],
    icon: "scan",
    badge: "Before and after",
    imageSrc: "/artwork/listing-item-removal-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-item-removal-before.webp",
    afterSrc: "/artwork/listing-item-removal-after.webp",
    isCompare: true,
  },
];

const SCENARIOS = [
  {
    title: "I want to show a space that does not exist yet",
    answer: "Interior or exterior renders are the best choice, with an aerial view if needed.",
  },
  {
    title: "I have an empty apartment and want a better listing",
    answer: "Virtual staging is the fastest way to make the space feel warmer without physical costs.",
  },
  {
    title: "Buyers cannot picture the layout of the apartment or house",
    answer: "2D and 3D floor plans give the clearest picture of the layout at a glance.",
  },
  {
    title: "I need a more interactive presentation",
    answer: "360° tours, 360° renders, and animations give a better sense of movement and space.",
  },
];

function serviceCardImageAlt(service: Service): string {
  return `${service.name} - ${service.short}`;
}

function serviceCardBeforeAlt(service: Service): string {
  return `${service.name} - view before visual editing`;
}

function serviceCardAfterAlt(service: Service): string {
  return `${service.name} - result after visual editing`;
}

// ─── Component ───────────────────────────────────────────

export function ServicesShowcase() {
  const displayCurrency = usePublicCurrency();
  const pricingSettings = usePublicPricingSettings();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("sve");

  const filtered = useMemo(
    () =>
      activeFilter === "sve"
        ? SERVICES
        : SERVICES.filter((s) => s.category === activeFilter),
    [activeFilter],
  );

  return (
    <div className="space-y-16 pb-20 lg:space-y-24">
      {/* ─── Hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-border/40">
        <div className="relative h-[420px] md:h-[500px]">
          <Image
            src={ARTWORK.hero}
            alt="Elegant Render interior - a photorealistic example of architectural visualization"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Complete offering
            </p>
            <h1 className="mt-3 max-w-2xl font-heading text-4xl leading-tight text-foreground md:text-5xl">
              Architectural visualization for every project and budget
            </h1>
          </div>
        </div>
      </section>

      {/* ─── Filters ───────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              "rounded-[4px] border px-4 py-2 text-sm font-medium transition-colors duration-200",
              activeFilter === f.key
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border/60 text-muted-foreground hover:border-[#d4d4d4] hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ─── Service Cards ─────────────────────────────── */}
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((service) => {
          const Icon = ICON_MAP[service.icon] ?? ImageIcon;
          return (
            <article
              key={service.name}
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/80 transition-[border-color,box-shadow] duration-200 hover:border-[#d4d4d4] hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)]"
            >
              {/* Card media — priority chain: iframe > video > before/after pair > image.
                  Interactive media (iframe/video/before-after reveal) is bumped to
                  z-10 so the stretched card link doesn't steal pointer events. */}
              {service.embedSrc ? (
                <div className="relative z-10 h-48 overflow-hidden bg-secondary/40">
                  <iframe
                    title={`${service.name} — 360° preview`}
                    className="h-full w-full border-0"
                    src={service.embedSrc}
                    allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur">
                    {service.badge}
                  </div>
                </div>
              ) : service.videoSrc ? (
                <div className="relative h-48 overflow-hidden bg-secondary/40">
                  <video
                    src={service.videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur">
                    {service.badge}
                  </div>
                </div>
              ) : service.beforeSrc && service.afterSrc ? (
                <BeforeAfterReveal
                  beforeSrc={service.beforeSrc}
                  afterSrc={service.afterSrc}
                  alt={serviceCardAfterAlt(service)}
                  beforeAlt={serviceCardBeforeAlt(service)}
                  afterAlt={serviceCardAfterAlt(service)}
                  sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                  autoDemoIntervalMs={7000}
                  className="relative z-10 h-48 w-full bg-secondary/40"
                >
                  <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur">
                    {service.badge}
                  </div>
                  <div className="pointer-events-none absolute bottom-3 left-3 flex overflow-hidden rounded-full border border-white/50 bg-white/90 text-[0.72rem] font-semibold uppercase tracking-wider shadow-sm backdrop-blur">
                    <span className="border-r border-border/20 px-2.5 py-1 text-muted-foreground">
                      Before
                    </span>
                    <span className="bg-accent/12 px-2.5 py-1 text-accent">
                      After
                    </span>
                  </div>
                </BeforeAfterReveal>
              ) : (
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={service.imageSrc}
                    alt={serviceCardImageAlt(service)}
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                    style={{ objectPosition: service.imagePosition }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
                  <div className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur">
                    {service.badge}
                  </div>
                  {service.isCompare && (
                    <div className="absolute bottom-3 left-3 flex overflow-hidden rounded-full border border-white/50 bg-white/90 text-[0.72rem] font-semibold uppercase tracking-wider shadow-sm backdrop-blur">
                      <span className="border-r border-border/20 px-2.5 py-1 text-muted-foreground">Before</span>
                      <span className="bg-accent/12 px-2.5 py-1 text-accent">After</span>
                    </div>
                  )}
                </div>
              )}

              {/* Price bar */}
              <div className="flex items-center justify-between border-b border-border/30 bg-secondary/30 px-5 py-3">
                <span className="text-xl font-bold text-foreground">
                  From{" "}
                  {formatPublicPrice(
                    service.priceEur,
                    displayCurrency,
                    pricingSettings,
                  )}
                </span>
                <span className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
                  Transparent pricing
                </span>
              </div>

              {/* Content */}
              <div className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/60">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground transition-colors duration-200 group-hover:text-accent">
                      {/* Stretched link: covers the entire card via ::after so the
                          whole surface opens the service detail page. The inquiry
                          CTA below sits on z-10 to escape this overlay. */}
                      <Link
                        href={`/services/${service.slug}`}
                        className="outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-accent/60"
                      >
                        {service.name}
                      </Link>
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {service.audience}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {service.short}
                </p>

                <div className="space-y-1.5">
                  {service.includes.map((inc) => (
                    <div key={inc} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      <span className="text-xs text-foreground/80">{inc}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-border/30 pt-4">
                  <QuickInquiryLink
                    inquiry={{
                      source: "services-card",
                      sourceLabel: service.name,
                      serviceType: service.name,
                    }}
                    className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:text-accent"
                  >
                    Request an estimate
                    <ChevronRight className="h-4 w-4" />
                  </QuickInquiryLink>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* ─── Scenario Guide ────────────────────────────── */}
      <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-2xl border border-border/40 bg-card/80 p-8">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            How to choose
          </p>
          <h2 className="mt-4 font-heading text-3xl leading-tight text-foreground md:text-4xl">
            Not sure which service you need?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Just tell us your goal — we suggest the most practical service.
          </p>
        </div>
        <div className="space-y-3">
          {SCENARIOS.map((item, i) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border/40 bg-card/80 p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/12 text-sm font-semibold text-accent">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Process Steps ─────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden rounded-2xl border border-border/40">
          <div className="relative h-full min-h-[320px]">
            <Image
              src={ARTWORK.floorplan}
              alt="3D floor plan - a clear apartment plan for property marketing"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                A simple process
              </p>
              <h2 className="mt-3 font-heading text-3xl leading-tight text-foreground">
                Easy to get started
              </h2>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: Send, title: "1. Send your materials", text: "Photos, a plan, a sketch, or just a short description." },
            { icon: BadgeDollarSign, title: "2. Receive a proposal", text: "A service recommendation, price, and scope that makes sense." },
            { icon: Clock3, title: "3. Preview and revisions", text: "A visual draft, then fine-tuning." },
            { icon: CheckCircle2, title: "4. Final for your listing", text: "Delivery ready for sale or presentation." },
          ].map((step) => {
            const StepIcon = step.icon;
            return (
              <div key={step.title} className="rounded-2xl border border-border/40 bg-card/80 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 text-accent">
                  <StepIcon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────── */}
      <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="space-y-4">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            FAQ
          </p>
          <h2 className="font-heading text-3xl leading-tight text-foreground md:text-4xl">
            Frequently asked questions
          </h2>
        </div>
        <div className="space-y-3">
          {SERVICES_PAGE_FAQS.map((item) => (
            <details
              key={item.question}
              className="group overflow-hidden rounded-2xl border border-border/40 bg-card/80 px-5 py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                <span className="flex items-center gap-3 text-base font-semibold text-foreground">
                  <CircleHelp className="h-4 w-4 flex-shrink-0 text-accent" />
                  {item.question}
                </span>
                <span className="text-sm text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pt-3 text-sm leading-relaxed text-muted-foreground">
                {formatPublicPriceText(
                  item.answer,
                  displayCurrency,
                  pricingSettings,
                )}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl bg-[#0a0a0a] p-8 text-white md:p-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <h2 className="font-heading text-3xl leading-tight md:text-4xl">
              Not sure exactly what you need?
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-white/70">
              Send a short project description and you will receive a service
              recommendation with an estimated price — free and with no
              obligation.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <QuickInquiryLink
                size="lg"
                className="rounded-[4px] bg-white text-[#0a0a0a] hover:bg-white/90"
                inquiry={{
                  source: "services-final-cta",
                  sourceLabel: "Services final CTA",
                }}
              >
                Request an estimate
                <ArrowRight className="ml-2 h-4 w-4" />
              </QuickInquiryLink>
              <ButtonLink
                href="/pricing"
                variant="outline"
                size="lg"
                className="rounded-[4px] border-white/20 text-white hover:bg-white/10"
              >
                See pricing
              </ButtonLink>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <span className="font-semibold text-white/85">Quick service selection</span>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Just explain your goal — we suggest the most logical service.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <span className="font-semibold text-white/85">Transparent pricing</span>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                You can see the budget level of every service right on this page.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
