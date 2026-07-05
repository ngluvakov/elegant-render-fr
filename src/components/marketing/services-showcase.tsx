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
  priceRsd: number;
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
  /** Surface the "Pre / posle" pill in the corner. Used for the 6 pair
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
  { key: "sve", label: "Sve usluge" },
  { key: "renderi", label: "Renderi" },
  { key: "osnove", label: "Osnove prostora" },
  { key: "360", label: "360 i animacije" },
  { key: "nekretnine", label: "Za prodaju nekretnine" },
];

const SERVICES: Service[] = [
  {
    name: "Unutrašnji renderi",
    slug: "render-enterijera",
    priceRsd: 19924,
    category: "renderi",
    short: "Vizuelizacija enterijera pre opremanja, renovacije ili prodaje prostora.",
    audience: "Za vlasnike stanova, arhitekte, dizajnere i manje investitore.",
    includes: ["10 statičkih rendera + tlocrt", "3D osnova uključena", "3 kruga korekcija"],
    icon: "home",
    badge: "Najtraženije",
    imageSrc: "/artwork/listing-interior-static.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "360 enterijeri",
    slug: "360-tura-enterijera",
    priceRsd: 34574,
    category: "360",
    short: "Interaktivna 360 tura kroz prostor sa dodatnim statičnim uglovima kamere.",
    audience: "Za prezentacije stanova, vila, salona i ugostiteljskih prostora.",
    includes: [
      "10 interaktivnih soba u 360 turi",
      "10 statičnih uglova kamere",
      "tlocrt sprata uključen",
    ],
    icon: "video",
    badge: "Interaktivno",
    imageSrc: "",
    imagePosition: "50% 50%",
    embedSrc: KUULA_EMBED,
  },
  {
    name: "Spoljašnji renderi",
    slug: "spoljasnji-renderi",
    priceRsd: 29300,
    category: "renderi",
    short: "Realističan prikaz kuće, zgrade ili fasade sa materijalima i okruženjem.",
    audience: "Za privatne kuće, manje stambene projekte i arhitektonske prezentacije.",
    includes: ["Prvi kadar uključen", "Model i scena osvetljenja", "Dodatni uglovi po nižoj ceni"],
    icon: "building",
    badge: "Eksterijer",
    imageSrc: "/artwork/listing-exterior-static.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "360 eksterijeri",
    slug: "360-eksterijer",
    priceRsd: 39262,
    category: "360",
    short: "VR-spreman prikaz eksterijera sa interaktivnim tačkama gledanja.",
    audience: "Za marketing prodaje kuća, vila i manjih razvojnih projekata.",
    includes: [
      "1 interaktivna tačka uključena",
      "Pun 3D model objekta",
      "Dodatne tačke gledanja po projektu",
    ],
    icon: "video",
    badge: "VR spremno",
    imageSrc: "/artwork/listing-exterior-360.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "3D prikaz ulice (streetscape)",
    slug: "3d-prikaz-ulice",
    priceRsd: 49224,
    category: "renderi",
    short: "Objekat sa susednim kućama, modelovan u 3D — prikaz iz ulice (a po potrebi i iz vazduha).",
    audience: "Za objekte kod kojih je važan kontekst ulice, susedstva i parcele.",
    includes: [
      "Pun 3D model objekta + okruženja",
      "Prvi prikaz uključen",
      "Bilo koji ugao (ulica ili iz vazduha)",
    ],
    icon: "scan",
    badge: "Streetscape",
    imageSrc: "/artwork/listing-streetscape.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "Uređenje pejzaža",
    slug: "uredjenje-pejzaza",
    priceRsd: 25784,
    category: "renderi",
    short: "Prikaz dvorišta, vrta, parkovskog ili spoljnog uređenja sa vegetacijom i terenom.",
    audience: "Za privatne kuće, vile i projekte gde je važan spoljašnji ambijent.",
    includes: ["Model terena", "Vegetacija i sadnja", "Prvi kadar uključen"],
    icon: "image",
    badge: "Spoljni ambijent",
    imageSrc: "/artwork/listing-landscape-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-landscape-before.webp",
    afterSrc: "/artwork/listing-landscape-after.webp",
    isCompare: true,
  },
  {
    name: "Render u stvarnoj fotografiji lokacije",
    slug: "render-u-stvarnoj-fotografiji",
    priceRsd: 35160,
    category: "renderi",
    short: "Vaš budući objekat uklopljen u stvarnu fotografiju lokacije — sa pravim okruženjem i svetlom.",
    audience: "Za dozvole, javne rasprave i prezentacije gde je važna verodostojnost lokacije.",
    includes: ["Analiza lokacije", "Usklađivanje perspektive", "Kompozit finalnog prikaza"],
    icon: "image",
    badge: "Realna lokacija",
    imageSrc: "/artwork/listing-photomontage-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-photomontage-before.webp",
    afterSrc: "/artwork/listing-photomontage-after.webp",
    isCompare: true,
  },
  {
    name: "3D osnove prostora",
    slug: "3d-osnove",
    priceRsd: 3399,
    category: "osnove",
    short: "Top-down 3D prikaz rasporeda prostorija, nameštaja i funkcionalne organizacije.",
    audience: "Za oglase, prezentacije stanova i lakše razumevanje rasporeda.",
    includes: ["Kompletan raspored", "Oznake prostorija", "Opcija nameštene verzije"],
    icon: "plans",
    badge: "Jasan raspored",
    imageSrc: "/artwork/listing-3d-floor-plans.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "2D osnove prostora",
    slug: "2d-osnove",
    priceRsd: 2344,
    category: "osnove",
    short: "Čiste i pregledne 2D osnove za marketing materijale, sajtove i oglase.",
    audience: "Za agente, vlasnike stanova i prodajne prezentacije nekretnina.",
    includes: ["Kolorisana osnova", "Nazivi prostorija", "Varijante stila i nameštaja"],
    icon: "plans",
    badge: "2D prikaz",
    imageSrc: "/artwork/listing-floorplan-2d.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "3D site planovi",
    slug: "situacioni-planovi",
    priceRsd: 41020,
    category: "osnove",
    short: "Pregled cele parcele sa objektima, pristupima, zelenilom i širim odnosom prostora.",
    audience: "Za kuće, vile, manje komplekse i prodajne brošure projekata.",
    includes: ["Parcela i objekti", "Pristupne površine", "Opcije sezonskih varijanti"],
    icon: "plans",
    badge: "Parcela i kontekst",
    imageSrc: "/artwork/listing-siteplan.webp",
    imagePosition: "50% 50%",
  },
  {
    name: "Arhitektonska animacija",
    slug: "arhitektonska-animacija",
    priceRsd: 26370,
    category: "360",
    short: "Video walkthrough i flythrough prikaz za snažniji prodajni utisak.",
    audience: "Za projekte kojima statični kadar nije dovoljan da pokaže prostor.",
    includes: ["Minimum 15 sekundi", "Cenovnik po sekundi", "Popusti za duže trajanje"],
    icon: "video",
    badge: "Video prikaz",
    imageSrc: "",
    imagePosition: "50% 50%",
    videoSrc: "/artwork/listing-animation.mp4",
  },
  {
    name: "VR tura",
    slug: "vr-tura",
    priceRsd: 2344,
    category: "360",
    short: "Web bazirane ture koje povezuju 360 kadrove u interaktivno iskustvo.",
    audience: "Za oglašavanje, prezentacije nekretnina i prodaju na daljinu.",
    includes: ["Sastavljanje ture", "Navigacija kroz prostor", "Brendirana verzija po potrebi"],
    icon: "video",
    badge: "Web iskustvo",
    imageSrc: "",
    imagePosition: "50% 50%",
    embedSrc:
      "https://kuula.co/share/collection/7kLnB?logo=1&info=0&fs=1&vr=1&sd=1&autorotate=0.04&autop=30&thumbs=1",
  },
  {
    name: "Virtuelno opremanje prostora",
    slug: "virtuelno-opremanje",
    priceRsd: 2110,
    category: "nekretnine",
    short: "Digitalno opremanje prazne prostorije na osnovu postojeće fotografije.",
    audience: "Za vlasnike nekretnina, agente i investitore koji žele bolji oglas.",
    includes: ["Prva stilizovana slika", "Dodatni uglovi po sobi", "Više soba uz povoljniji raspon"],
    icon: "sparkles",
    badge: "Pre i posle",
    imageSrc: "/artwork/listing-staging-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-staging-before.webp",
    afterSrc: "/artwork/listing-staging-after.webp",
    isCompare: true,
  },
  {
    name: "Virtuelna renovacija prostora",
    slug: "virtuelna-renovacija",
    priceRsd: 7735,
    category: "nekretnine",
    short: "Prikaz kako bi prostor izgledao nakon adaptacije i promene materijala.",
    audience: "Za kupce nekretnina, vlasnike i dizajnere koji žele jasan pre-posle scenario.",
    includes: ["Predlog novog izgleda", "Materijali i završne obrade", "Više uglova ili soba"],
    icon: "sparkles",
    badge: "Pre i posle",
    imageSrc: "/artwork/listing-renovation-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-renovation-before.webp",
    afterSrc: "/artwork/listing-renovation-after.webp",
    isCompare: true,
  },
  {
    name: "Dnevni u noćni prikaz",
    slug: "dnevni-u-nocni-prikaz",
    priceRsd: 1172,
    category: "nekretnine",
    short: "Pretvaranje dnevne fotografije eksterijera u atraktivniji sumrak.",
    audience: "Za oglase kojima treba jači prvi utisak.",
    includes: ["Zamena neba", "Kolor i svetlosna obrada", "Volumenski popust za više slika"],
    icon: "image",
    badge: "Pre i posle",
    imageSrc: "/artwork/listing-day-to-dusk-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-day-to-dusk-before.webp",
    afterSrc: "/artwork/listing-day-to-dusk-after.webp",
    isCompare: true,
  },
  {
    name: "Uklanjanje elemenata",
    slug: "uklanjanje-predmeta",
    priceRsd: 1406,
    category: "nekretnine",
    short: "Digitalno uklanjanje nereda i neželjenih objekata sa fotografije prostora.",
    audience: "Za pripremu nekretnine za oglas, izdavanje ili prezentaciju.",
    includes: ["Čišćenje kadra", "Rekonstrukcija pozadine", "Jednostavne i kompleksne izmene"],
    icon: "scan",
    badge: "Pre i posle",
    imageSrc: "/artwork/listing-item-removal-after.webp",
    imagePosition: "50% 50%",
    beforeSrc: "/artwork/listing-item-removal-before.webp",
    afterSrc: "/artwork/listing-item-removal-after.webp",
    isCompare: true,
  },
];

const SCENARIOS = [
  {
    title: "Želim da prikažem prostor koji još ne postoji",
    answer: "Najbolji izbor su unutrašnji ili spoljašnji renderi, a po potrebi i prikaz iz vazduha.",
  },
  {
    title: "Imam prazan stan i želim bolji oglas",
    answer: "Virtuelno opremanje je najbrži način da prostor izgleda toplije bez fizičkog troška.",
  },
  {
    title: "Kupac ne razume raspored stana ili kuće",
    answer: "2D i 3D osnove daju najjasniju sliku organizacije prostora na prvi pogled.",
  },
  {
    title: "Treba mi interaktivnija prezentacija",
    answer: "360 ture, 360 renderi i animacije daju bolji osećaj kretanja i prostora.",
  },
];

function serviceCardImageAlt(service: Service): string {
  return `${service.name} - ${service.short}`;
}

function serviceCardBeforeAlt(service: Service): string {
  return `${service.name} - prikaz pre vizuelne obrade`;
}

function serviceCardAfterAlt(service: Service): string {
  return `${service.name} - rezultat posle vizuelne obrade`;
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
            alt="Elegant Render enterijer - fotorealističan primer arhitektonske vizuelizacije"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-accent">
              Kompletna ponuda
            </p>
            <h1 className="mt-3 max-w-2xl font-heading text-4xl leading-tight text-foreground md:text-5xl">
              Arhitektonska vizuelizacija za svaki projekat i budžet
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
              "rounded-full border px-4 py-2 text-sm font-medium transition-all",
              activeFilter === f.key
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border/60 text-muted-foreground hover:border-accent/40 hover:text-foreground",
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
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/80 shadow-[0_8px_30px_rgba(28,26,25,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_18px_44px_rgba(28,26,25,0.08)]"
            >
              {/* Card media — priority chain: iframe > video > before/after pair > image.
                  Interactive media (iframe/video/before-after reveal) is bumped to
                  z-10 so the stretched card link doesn't steal pointer events. */}
              {service.embedSrc ? (
                <div className="relative z-10 h-48 overflow-hidden bg-secondary/40">
                  <iframe
                    title={`${service.name} — 360 pregled`}
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
                  className="relative z-10 h-48 w-full bg-secondary/40"
                >
                  <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur">
                    {service.badge}
                  </div>
                  <div className="pointer-events-none absolute bottom-3 left-3 flex overflow-hidden rounded-full border border-white/50 bg-white/90 text-[0.72rem] font-semibold uppercase tracking-wider shadow-sm backdrop-blur">
                    <span className="border-r border-border/20 px-2.5 py-1 text-muted-foreground">
                      Pre
                    </span>
                    <span className="bg-accent/12 px-2.5 py-1 text-accent">
                      Posle
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
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    style={{ objectPosition: service.imagePosition }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
                  <div className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur">
                    {service.badge}
                  </div>
                  {service.isCompare && (
                    <div className="absolute bottom-3 left-3 flex overflow-hidden rounded-full border border-white/50 bg-white/90 text-[0.72rem] font-semibold uppercase tracking-wider shadow-sm backdrop-blur">
                      <span className="border-r border-border/20 px-2.5 py-1 text-muted-foreground">Pre</span>
                      <span className="bg-accent/12 px-2.5 py-1 text-accent">Posle</span>
                    </div>
                  )}
                </div>
              )}

              {/* Price bar */}
              <div className="flex items-center justify-between border-b border-border/30 bg-secondary/30 px-5 py-3">
                <span className="text-xl font-bold text-foreground">
                  Od{" "}
                  {formatPublicPrice(
                    service.priceRsd,
                    displayCurrency,
                    pricingSettings,
                  )}
                </span>
                <span className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
                  Transparentna cena
                </span>
              </div>

              {/* Content */}
              <div className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/60">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-accent">
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
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--color-sage)]" />
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
                    className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-accent"
                  >
                    Zatraži ponudu
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
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-accent">
            Kako da izaberete
          </p>
          <h2 className="mt-4 font-heading text-3xl leading-tight text-foreground md:text-4xl">
            Niste sigurni koja usluga vam treba?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Dovoljno je da znate cilj — mi predlažemo najpraktičniju uslugu.
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
              alt="3D osnova prostora - pregledan plan stana za marketing nekretnine"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-accent">
                Jednostavan proces
              </p>
              <h2 className="mt-3 font-heading text-3xl leading-tight text-foreground">
                Lak za pokretanje
              </h2>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: Send, title: "1. Pošaljete materijale", text: "Fotografije, plan, skicu ili samo kratak opis." },
            { icon: BadgeDollarSign, title: "2. Dobijete predlog", text: "Preporuka usluge, cena i obim koji ima smisla." },
            { icon: Clock3, title: "3. Prikaz i korekcije", text: "Vizuelni predlog, zatim fino podešavanje." },
            { icon: CheckCircle2, title: "4. Final za oglas", text: "Isporuka spremna za prodaju ili prezentaciju." },
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
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-accent">
            FAQ
          </p>
          <h2 className="font-heading text-3xl leading-tight text-foreground md:text-4xl">
            Najčešća pitanja
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
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-foreground via-foreground/95 to-accent/80 p-8 text-background shadow-[0_24px_70px_rgba(28,26,25,0.15)] md:p-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <h2 className="font-heading text-3xl leading-tight md:text-4xl">
              Niste sigurni šta vam tačno treba?
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-background/70">
              Pošaljite kratak opis projekta i dobićete preporuku usluge sa
              okvirnom cenom — besplatno i bez obaveza.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <QuickInquiryLink
                size="lg"
                className="rounded-full bg-background text-foreground hover:bg-background/90"
                inquiry={{
                  source: "services-final-cta",
                  sourceLabel: "Usluge final CTA",
                }}
              >
                Zatražite ponudu
                <ArrowRight className="ml-2 h-4 w-4" />
              </QuickInquiryLink>
              <ButtonLink
                href="/pricing"
                variant="outline"
                size="lg"
                className="rounded-full border-background/20 text-background hover:bg-background/10"
              >
                Pogledajte cenovnik
              </ButtonLink>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-background/10 bg-background/8 p-5">
              <span className="font-semibold text-background/85">Brz izbor usluge</span>
              <p className="mt-2 text-sm leading-relaxed text-background/60">
                Dovoljno je da objasnite cilj — predlažemo najlogičniju uslugu.
              </p>
            </div>
            <div className="rounded-2xl border border-background/10 bg-background/8 p-5">
              <span className="font-semibold text-background/85">Transparentna cena</span>
              <p className="mt-2 text-sm leading-relaxed text-background/60">
                Već na ovoj stranici vidite budžetski nivo svake usluge.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
