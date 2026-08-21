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
  /** Surface the "Avant / après" pill in the corner. Used for the 6 pair
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
  { key: "sve", label: "Tous les services" },
  { key: "renderi", label: "Rendus" },
  { key: "osnove", label: "Plans" },
  { key: "360", label: "360° et animations" },
  { key: "nekretnine", label: "Pour la vente immobilière" },
];

const SERVICES: Service[] = [
  {
    name: "Rendus d’intérieur",
    slug: "interior-render",
    priceEur: 170,
    category: "renderi",
    short: "La visualisation d’intérieur avant ameublement, rénovation ou vente.",
    audience: "Pour les propriétaires d’appartements, architectes, designers et petits investisseurs.",
    includes: ["10 rendus statiques + plan", "Plan 3D inclus", "3 séries de révisions"],
    icon: "home",
    badge: "Le plus demandé",
    imageSrc: "/artwork/listing-interior-static.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "Intérieurs 360°",
    slug: "interior-360-tour",
    priceEur: 295,
    category: "360",
    short: "Une visite 360° interactive de l’espace avec des angles de caméra statiques supplémentaires.",
    audience: "Pour présenter appartements, villas, showrooms et espaces hôteliers.",
    includes: [
      "10 pièces interactives dans une visite 360°",
      "10 angles de caméra statiques",
      "Plan inclus",
    ],
    icon: "video",
    badge: "Interactif",
    imageSrc: "",
    imagePosition: "50% 50%",
    embedSrc: KUULA_EMBED,
  },
  {
    name: "Rendus d’extérieur",
    slug: "exterior-renders",
    priceEur: 250,
    category: "renderi",
    short: "Une vue réaliste d’une maison, d’un immeuble ou d’une façade avec matériaux et environnement.",
    audience: "Pour les maisons individuelles, les petits projets résidentiels et les présentations d’architecture.",
    includes: ["Première vue incluse", "Modèle et scène d’éclairage", "Angles supplémentaires à prix réduit"],
    icon: "building",
    badge: "Extérieur",
    imageSrc: "/artwork/listing-exterior-static.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "Extérieurs 360°",
    slug: "exterior-360",
    priceEur: 335,
    category: "360",
    short: "Une vue extérieure prête pour la VR avec des points de vue interactifs.",
    audience: "Pour la commercialisation de maisons, villas et petits programmes immobiliers.",
    includes: [
      "1 point de vue interactif inclus",
      "Modèle 3D complet du bâtiment",
      "Points de vue supplémentaires par projet",
    ],
    icon: "video",
    badge: "Prêt pour la VR",
    imageSrc: "/artwork/listing-exterior-360.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "Perspective de rue 3D",
    slug: "3d-streetscape",
    priceEur: 420,
    category: "renderi",
    short: "Votre bâtiment avec les maisons voisines, modélisé en 3D — vu depuis la rue (et du ciel si besoin).",
    audience: "Pour les bâtiments où le contexte de la rue, du quartier et de la parcelle compte.",
    includes: [
      "Modèle 3D complet du bâtiment + environs",
      "Première vue incluse",
      "N’importe quel angle (rue ou aérien)",
    ],
    icon: "scan",
    badge: "Perspective de rue",
    imageSrc: "/artwork/listing-streetscape.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "Aménagement paysager",
    slug: "landscape-design",
    priceEur: 220,
    category: "renderi",
    short: "Une vue d’une cour, d’un jardin, d’un parc ou d’un aménagement extérieur avec végétation et terrain.",
    audience: "Pour les maisons individuelles, les villas et les projets où le cadre extérieur compte.",
    includes: ["Modèle du terrain", "Végétation et plantations", "Première vue incluse"],
    icon: "image",
    badge: "Cadre extérieur",
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
    short: "Votre futur bâtiment intégré dans une vraie photo du site — avec l’environnement et la lumière réels.",
    audience: "Pour les permis, les enquêtes publiques et les présentations où la fidélité au site compte.",
    includes: ["Analyse du site", "Calage de perspective", "Composite final"],
    icon: "image",
    badge: "Site réel",
    imageSrc: "/artwork/listing-photomontage-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-photomontage-before.webp",
    afterSrc: "/artwork/listing-photomontage-after.webp",
    isCompare: true,
  },
  {
    name: "Plans 3D",
    slug: "3d-floor-plans",
    priceEur: 29,
    category: "osnove",
    short: "Une vue 3D en plongée de la disposition des pièces, du mobilier et de l’organisation fonctionnelle.",
    audience: "Pour les annonces, la présentation d’appartements et une lecture plus facile de la disposition.",
    includes: ["Disposition complète", "Noms des pièces", "Version meublée disponible"],
    icon: "plans",
    badge: "Disposition claire",
    imageSrc: "/artwork/listing-3d-floor-plans.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "Plans 2D",
    slug: "2d-floor-plans",
    priceEur: 20,
    category: "osnove",
    short: "Des plans 2D propres et lisibles pour les supports marketing, les sites web et les annonces.",
    audience: "Pour les agents, les propriétaires d’appartements et les présentations de vente.",
    includes: ["Plan en couleurs", "Noms des pièces", "Variantes de style et de mobilier"],
    icon: "plans",
    badge: "Vue 2D",
    imageSrc: "/artwork/listing-floorplan-2d.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "Plans de masse 3D",
    slug: "site-plans",
    priceEur: 350,
    category: "osnove",
    short: "Une vue d’ensemble de la parcelle avec bâtiments, accès, espaces verts et contexte spatial élargi.",
    audience: "Pour les maisons, villas, petits ensembles et brochures de vente de projets.",
    includes: ["Parcelle et bâtiments", "Zones d’accès", "Variantes saisonnières disponibles"],
    icon: "plans",
    badge: "Parcelle et contexte",
    imageSrc: "/artwork/listing-siteplan.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "Animation architecturale",
    slug: "architectural-animation",
    priceEur: 225,
    category: "360",
    short: "Vidéo de visite et de survol pour une impression de vente plus forte.",
    audience: "Pour les projets où une vue statique ne suffit pas à montrer l’espace.",
    includes: ["15 secondes minimum", "Facturée à la seconde", "Remises sur les durées plus longues"],
    icon: "video",
    badge: "Vidéo",
    imageSrc: "",
    imagePosition: "50% 50%",
    videoSrc: "/artwork/listing-animation.mp4",
  },
  {
    name: "Visite en réalité virtuelle (VR)",
    slug: "vr-tour",
    priceEur: 20,
    category: "360",
    short: "Des visites web qui relient des vues 360° en une expérience interactive.",
    audience: "Pour la publicité, la présentation de biens et la vente à distance.",
    includes: ["Assemblage de la visite", "Navigation dans l’espace", "Version à votre marque sur demande"],
    icon: "video",
    badge: "Expérience web",
    imageSrc: "",
    imagePosition: "50% 50%",
    embedSrc:
      "https://kuula.co/share/collection/7kLnB?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
  },
  {
    name: "Home staging virtuel",
    slug: "virtual-staging",
    priceEur: 18,
    category: "nekretnine",
    short: "L’ameublement numérique d’une pièce vide à partir d’une photo existante.",
    audience: "Pour les propriétaires, agents et investisseurs qui veulent une meilleure annonce.",
    includes: ["Première image stylisée", "Angles supplémentaires par pièce", "Meilleurs tarifs pour plusieurs pièces"],
    icon: "sparkles",
    badge: "Avant et après",
    imageSrc: "/artwork/listing-staging-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-staging-before.webp",
    afterSrc: "/artwork/listing-staging-after.webp",
    isCompare: true,
  },
  {
    name: "Rénovation virtuelle",
    slug: "virtual-renovation",
    priceEur: 66,
    category: "nekretnine",
    short: "Un aperçu de l’espace après rénovation et nouveaux matériaux.",
    audience: "Pour les acheteurs, propriétaires et designers qui veulent un scénario avant/après clair.",
    includes: ["Proposition de nouvelle apparence", "Matériaux et finitions", "Plusieurs angles ou pièces"],
    icon: "sparkles",
    badge: "Avant et après",
    imageSrc: "/artwork/listing-renovation-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-renovation-before.webp",
    afterSrc: "/artwork/listing-renovation-after.webp",
    isCompare: true,
  },
  {
    name: "Jour au crépuscule",
    slug: "day-to-dusk",
    priceEur: 10,
    category: "nekretnine",
    short: "La transformation d’une photo extérieure de jour en une scène de crépuscule plus saisissante.",
    audience: "Pour les annonces qui ont besoin d’une première impression plus forte.",
    includes: ["Remplacement du ciel", "Étalonnage des couleurs et de la lumière", "Remise de volume pour plusieurs images"],
    icon: "image",
    badge: "Avant et après",
    imageSrc: "/artwork/listing-day-to-dusk-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-day-to-dusk-before.webp",
    afterSrc: "/artwork/listing-day-to-dusk-after.webp",
    isCompare: true,
  },
  {
    name: "Suppression d’objets",
    slug: "item-removal",
    priceEur: 12,
    category: "nekretnine",
    short: "La suppression numérique du désordre et des objets indésirables d’une photo de l’espace.",
    audience: "Pour préparer un bien à l’annonce, à la location ou à la présentation.",
    includes: ["Nettoyage du cadre", "Reconstruction de l’arrière-plan", "Retouches simples et complexes"],
    icon: "scan",
    badge: "Avant et après",
    imageSrc: "/artwork/listing-item-removal-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-item-removal-before.webp",
    afterSrc: "/artwork/listing-item-removal-after.webp",
    isCompare: true,
  },
];

const SCENARIOS = [
  {
    title: "Je veux montrer un espace qui n’existe pas encore",
    answer: "Les rendus d’intérieur ou d’extérieur sont le meilleur choix, avec une vue aérienne si besoin.",
  },
  {
    title: "J’ai un appartement vide et je veux une meilleure annonce",
    answer: "Le home staging virtuel est le moyen le plus rapide de rendre l’espace plus chaleureux, sans frais physiques.",
  },
  {
    title: "Les acheteurs n’arrivent pas à se représenter la disposition de l’appartement ou de la maison",
    answer: "Les plans 2D et 3D donnent l’image la plus claire de la disposition en un coup d’œil.",
  },
  {
    title: "Il me faut une présentation plus interactive",
    answer: "Les visites 360°, les rendus 360° et les animations donnent une meilleure sensation de mouvement et d’espace.",
  },
];

function serviceCardImageAlt(service: Service): string {
  return `${service.name} - ${service.short}`;
}

function serviceCardBeforeAlt(service: Service): string {
  return `${service.name} - vue avant la retouche visuelle`;
}

function serviceCardAfterAlt(service: Service): string {
  return `${service.name} - résultat après la retouche visuelle`;
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
            alt="Intérieur Elegant Render - un exemple photoréaliste de visualisation architecturale"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Offre complète
            </p>
            <h1 className="mt-3 max-w-2xl font-heading text-4xl leading-tight text-foreground md:text-5xl">
              La visualisation architecturale pour chaque projet et chaque budget
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
                    title={`${service.name} — aperçu 360°`}
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
                      Avant
                    </span>
                    <span className="bg-accent/12 px-2.5 py-1 text-accent">
                      Après
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
                      <span className="border-r border-border/20 px-2.5 py-1 text-muted-foreground">Avant</span>
                      <span className="bg-accent/12 px-2.5 py-1 text-accent">Après</span>
                    </div>
                  )}
                </div>
              )}

              {/* Price bar */}
              <div className="flex items-center justify-between border-b border-border/30 bg-secondary/30 px-5 py-3">
                <span className="text-xl font-bold text-foreground">
                  Dès{" "}
                  {formatPublicPrice(
                    service.priceEur,
                    displayCurrency,
                    pricingSettings,
                  )}
                </span>
                <span className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
                  Prix transparents
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
                    Demander un devis
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
            Comment choisir
          </p>
          <h2 className="mt-4 font-heading text-3xl leading-tight text-foreground md:text-4xl">
            Vous ne savez pas quel service il vous faut ?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Dites-nous simplement votre objectif — nous vous proposons le
            service le plus pratique.
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
              alt="Plan 3D - un plan d’appartement clair pour le marketing immobilier"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Un processus simple
              </p>
              <h2 className="mt-3 font-heading text-3xl leading-tight text-foreground">
                Un démarrage facile
              </h2>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: Send, title: "1. Envoyez vos éléments", text: "Des photos, un plan, un croquis ou simplement une courte description." },
            { icon: BadgeDollarSign, title: "2. Recevez une proposition", text: "Une recommandation de service, un prix et un périmètre cohérents." },
            { icon: Clock3, title: "3. Aperçu et révisions", text: "Une ébauche visuelle, puis les ajustements." },
            { icon: CheckCircle2, title: "4. Le final pour votre annonce", text: "Une livraison prête pour la vente ou la présentation." },
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
            Questions fréquentes
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
              Vous ne savez pas exactement ce qu’il vous faut ?
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-white/70">
              Envoyez une courte description de votre projet et vous recevrez
              une recommandation de service avec un prix estimé — gratuitement
              et sans engagement.
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
                Demander un devis
                <ArrowRight className="ml-2 h-4 w-4" />
              </QuickInquiryLink>
              <ButtonLink
                href="/pricing"
                variant="outline"
                size="lg"
                className="rounded-[4px] border-white/20 text-white hover:bg-white/10"
              >
                Voir les tarifs
              </ButtonLink>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <span className="font-semibold text-white/85">Choix rapide du service</span>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Expliquez simplement votre objectif — nous vous proposons le
                service le plus logique.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <span className="font-semibold text-white/85">Prix transparents</span>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Vous voyez le niveau de budget de chaque service directement
                sur cette page.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
