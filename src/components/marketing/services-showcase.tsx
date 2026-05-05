/**
 * ServicesShowcase — Rich services page with filterable cards, artwork images,
 * 360 Kuula embed, before/after showcase, scenario guide, process steps, and FAQ.
 *
 * Used on: /usluge (services page).
 */
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  BadgeEuro,
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
import {
  usePublicCurrency,
  usePublicPricingSettings,
} from "@/components/site/public-currency-provider";
import { formatPublicPrice } from "@/lib/catalog/display-currency";
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
  beforeAfter: "/artwork/elegant-render-services-before-after-grid.webp",
};

const KUULA_EMBED =
  "https://kuula.co/share/collection/71kZD?logo=0&info=0&fs=1&vr=0&sd=0&autorotate=0.14&autop=5&thumbs=0";
const KUULA_LINK = "https://kuula.co/share/collection/71kZD";

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
  isCompare?: boolean;
  is360Embed?: boolean;
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
    slug: "unutrasnji-renderi",
    priceEur: 170,
    category: "renderi",
    short: "Vizuelizacija enterijera pre opremanja, renovacije ili prodaje prostora.",
    audience: "Za vlasnike stanova, arhitekte, dizajnere i manje investitore.",
    includes: ["Do 10 prostorija po spratu", "3D osnova uključena", "3 kruga korekcija"],
    icon: "home",
    badge: "Najtraženije",
    imageSrc: ARTWORK.triptych1,
    imagePosition: "0% 50%",
  },
  {
    name: "360° enterijeri",
    slug: "unutrasnji-renderi",
    priceEur: 295,
    category: "360",
    short: "Interaktivni prikaz prostora kroz 360 hotspot scene i dodatne statične kadrove.",
    audience: "Za prezentacije stanova, vila, salona i ugostiteljskih prostora.",
    includes: ["10 hotspot prostorija", "10 statičnih kadrova", "3D osnova uključena"],
    icon: "video",
    badge: "Interaktivno",
    imageSrc: ARTWORK.triptych1,
    imagePosition: "50% 50%",
    is360Embed: true,
  },
  {
    name: "Spoljašnji renderi",
    slug: "spoljasnji-renderi",
    priceEur: 250,
    category: "renderi",
    short: "Realističan prikaz kuće, zgrade ili fasade sa materijalima i okruženjem.",
    audience: "Za privatne kuće, manje stambene projekte i arhitektonske prezentacije.",
    includes: ["Prvi kadar uključen", "Model i scena osvetljenja", "Dodatni uglovi po nižoj ceni"],
    icon: "building",
    badge: "Eksterijer",
    imageSrc: ARTWORK.triptych1,
    imagePosition: "100% 50%",
  },
  {
    name: "360° eksterijeri",
    slug: "spoljasnji-renderi",
    priceEur: 335,
    category: "360",
    short: "VR-spreman prikaz eksterijera sa interaktivnim tačkama posmatranja.",
    audience: "Za marketing prodaje kuća, vila i manjih razvojnih projekata.",
    includes: ["1 hotspot uključen", "Interaktivni prikaz", "Dodatni hotspoti po projektu"],
    icon: "video",
    badge: "VR spremno",
    imageSrc: ARTWORK.triptych2,
    imagePosition: "0% 50%",
  },
  {
    name: "Aerial renderi",
    slug: "spoljasnji-renderi",
    priceEur: 420,
    category: "renderi",
    short: "Pogled iz vazduha za objekte kod kojih je važan širi kontekst parcele i okoline.",
    audience: "Za manje komplekse, parcele, kuće i investitore kojima treba pregled lokacije.",
    includes: ["Aerial kadar uključen", "Okruženje i pristupi", "Mogući dodatni uglovi"],
    icon: "scan",
    badge: "Iz vazduha",
    imageSrc: ARTWORK.triptych2,
    imagePosition: "50% 50%",
  },
  {
    name: "Landscape renderi",
    slug: "prikazi-dvorista",
    priceEur: 220,
    category: "renderi",
    short: "Prikaz dvorišta, vrta, parkovskog ili spoljnog uređenja sa vegetacijom i terenom.",
    audience: "Za privatne kuće, vile i projekte gde je važan spoljašnji ambijent.",
    includes: ["Model terena", "Vegetacija i sadnja", "Prvi kadar uključen"],
    icon: "image",
    badge: "Spoljni ambijent",
    imageSrc: ARTWORK.triptych2,
    imagePosition: "100% 50%",
  },
  {
    name: "Fotomontaža",
    slug: "fotomontaza",
    priceEur: 300,
    category: "renderi",
    short: "Uklapanje budućeg objekta u realnu fotografiju lokacije radi jasnije prezentacije.",
    audience: "Za arhitekte, manje developere i prezentacije objekata u kontekstu.",
    includes: ["Analiza lokacije", "Usklađivanje perspektive", "Kompozit finalnog prikaza"],
    icon: "image",
    badge: "Realna lokacija",
    imageSrc: ARTWORK.triptych3,
    imagePosition: "0% 50%",
  },
  {
    name: "3D osnove prostora",
    slug: "osnove-prostora",
    priceEur: 29,
    category: "osnove",
    short: "Top-down 3D prikaz rasporeda prostorija, nameštaja i funkcionalne organizacije.",
    audience: "Za oglase, prezentacije stanova i lakše razumevanje rasporeda.",
    includes: ["Kompletan raspored", "Oznake prostorija", "Opcija nameštene verzije"],
    icon: "plans",
    badge: "Jasan raspored",
    imageSrc: ARTWORK.triptych3,
    imagePosition: "50% 50%",
  },
  {
    name: "2D osnove prostora",
    slug: "osnove-prostora",
    priceEur: 20,
    category: "osnove",
    short: "Čiste i pregledne 2D osnove za marketing materijale, sajtove i oglase.",
    audience: "Za agente, vlasnike stanova i prodajne prezentacije nekretnina.",
    includes: ["Kolorisana osnova", "Nazivi prostorija", "Varijante stila i nameštaja"],
    icon: "plans",
    badge: "2D prikaz",
    imageSrc: ARTWORK.triptych3,
    imagePosition: "100% 50%",
  },
  {
    name: "3D site planovi",
    slug: "situacioni-prikazi",
    priceEur: 350,
    category: "osnove",
    short: "Pregled cele parcele sa objektima, pristupima, zelenilom i širim odnosom prostora.",
    audience: "Za kuće, vile, manje komplekse i prodajne brošure projekata.",
    includes: ["Parcela i objekti", "Pristupne površine", "Opcije sezonskih varijanti"],
    icon: "plans",
    badge: "Parcela i kontekst",
    imageSrc: ARTWORK.triptych4,
    imagePosition: "0% 50%",
  },
  {
    name: "Arhitektonske animacije",
    slug: "animacije-i-ture",
    priceEur: 225,
    category: "360",
    short: "Video walkthrough i flythrough prikaz za snažniji prodajni utisak.",
    audience: "Za projekte kojima statični kadar nije dovoljan da pokaže prostor.",
    includes: ["Minimum 15 sekundi", "Cenovnik po sekundi", "Popusti za duže trajanje"],
    icon: "video",
    badge: "Video prikaz",
    imageSrc: ARTWORK.triptych4,
    imagePosition: "50% 50%",
  },
  {
    name: "360 ture",
    slug: "animacije-i-ture",
    priceEur: 20,
    category: "360",
    short: "Web bazirane ture koje povezuju 360 kadrove u interaktivno iskustvo.",
    audience: "Za oglašavanje, prezentacije nekretnina i prodaju na daljinu.",
    includes: ["Sastavljanje ture", "Navigacija kroz prostor", "Brendirana verzija po potrebi"],
    icon: "video",
    badge: "Web iskustvo",
    imageSrc: ARTWORK.triptych4,
    imagePosition: "100% 50%",
  },
  {
    name: "Virtuelno opremanje prostora",
    slug: "virtuelno-opremanje",
    priceEur: 18,
    category: "nekretnine",
    short: "Digitalno opremanje prazne prostorije na osnovu postojeće fotografije.",
    audience: "Za vlasnike nekretnina, agente i investitore koji žele bolji oglas.",
    includes: ["Prva stilizovana slika", "Dodatni uglovi po sobi", "Više soba uz povoljniji raspon"],
    icon: "sparkles",
    badge: "Pre i posle",
    imageSrc: ARTWORK.beforeAfter,
    imagePosition: "0% 0%",
    isCompare: true,
  },
  {
    name: "Virtuelna renovacija prostora",
    slug: "virtuelna-renovacija",
    priceEur: 66,
    category: "nekretnine",
    short: "Prikaz kako bi prostor izgledao nakon adaptacije i promene materijala.",
    audience: "Za kupce nekretnina, vlasnike i dizajnere koji žele jasan pre-posle scenario.",
    includes: ["Predlog novog izgleda", "Materijali i završne obrade", "Više uglova ili soba"],
    icon: "sparkles",
    badge: "Pre i posle",
    imageSrc: ARTWORK.beforeAfter,
    imagePosition: "100% 0%",
    isCompare: true,
  },
  {
    name: "Day-to-dusk obrada",
    slug: "dan-u-noc",
    priceEur: 10,
    category: "nekretnine",
    short: "Pretvaranje dnevne fotografije eksterijera u atraktivniji sumrak.",
    audience: "Za oglase kojima treba jači prvi utisak.",
    includes: ["Zamena neba", "Kolor i svetlosna obrada", "Volumenski popust za više slika"],
    icon: "image",
    badge: "Pre i posle",
    imageSrc: ARTWORK.beforeAfter,
    imagePosition: "0% 100%",
    isCompare: true,
  },
  {
    name: "Uklanjanje elemenata",
    slug: "uklanjanje-elemenata",
    priceEur: 12,
    category: "nekretnine",
    short: "Digitalno uklanjanje nereda i neželjenih objekata sa fotografije prostora.",
    audience: "Za pripremu nekretnine za oglas, izdavanje ili prezentaciju.",
    includes: ["Čišćenje kadra", "Rekonstrukcija pozadine", "Jednostavne i kompleksne izmene"],
    icon: "scan",
    badge: "Pre i posle",
    imageSrc: ARTWORK.beforeAfter,
    imagePosition: "100% 100%",
    isCompare: true,
  },
];

const SCENARIOS = [
  {
    title: "Želim da prikažem prostor koji još ne postoji",
    answer: "Najbolji izbor su unutrašnji ili spoljašnji renderi, a po potrebi i aerial prikaz.",
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

const COMPARE_SHOWCASE = [
  { title: "Virtuelno opremanje", text: "Prazna prostorija odmah dobija toplinu i kontekst za oglas.", position: "0% 0%" },
  { title: "Virtuelna renovacija", text: "Kupac dobija jasnu sliku kako prostor može da izgleda nakon adaptacije.", position: "100% 0%" },
  { title: "Day-to-dusk obrada", text: "Jedan kadar prelazi iz obične dnevne fotografije u jači večernji utisak.", position: "0% 100%" },
  { title: "Uklanjanje elemenata", text: "Nered i lične stvari nestaju iz kadra da prostor deluje urednije.", position: "100% 100%" },
];

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
            alt="Elegant Render enterijer"
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
              className="group overflow-hidden rounded-2xl border border-border/40 bg-card/80 shadow-[0_8px_30px_rgba(28,26,25,0.04)] transition-shadow hover:shadow-[0_16px_50px_rgba(28,26,25,0.08)]"
            >
              {/* Image */}
              {service.is360Embed ? (
                <div className="relative h-48 overflow-hidden bg-secondary/40">
                  <iframe
                    title="360 preview"
                    className="h-full w-full border-0"
                    src={KUULA_EMBED}
                    allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
                    loading="lazy"
                  />
                  <div className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur">
                    {service.badge}
                  </div>
                </div>
              ) : (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={service.imageSrc}
                    alt={service.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
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
                    service.priceEur,
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
                    <h3 className="text-base font-semibold text-foreground">
                      {service.name}
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
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-accent"
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

      {/* ─── 360 Embed Section ─────────────────────────── */}
      <section className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div className="space-y-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-accent">
              360 enterijeri uživo
            </p>
            <h2 className="font-heading text-3xl leading-tight text-foreground md:text-4xl">
              Ovako izgleda <span className="text-accent">360 prikaz</span> vašeg prostora
            </h2>
          </div>
          <p className="text-base leading-relaxed text-muted-foreground">
            Interaktivni prikaz u kome možete da se krećete kroz prostor, gledate
            u svim pravcima i steknete realan osećaj enterijera.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border/40 bg-secondary/30 p-3 shadow-[0_20px_60px_rgba(28,26,25,0.08)] md:p-4">
          <div
            className="overflow-hidden rounded-2xl bg-secondary/60"
            style={{ minHeight: "480px", height: "56vh", maxHeight: "700px" }}
          >
            <iframe
              title="Elegant Render 360 enterijeri"
              className="h-full w-full border-0"
              src={KUULA_EMBED}
              allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={KUULA_LINK}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
          >
            Otvori puni prikaz
            <ArrowRight className="h-4 w-4" />
          </a>
          <QuickInquiryLink
            variant="outline"
            className="rounded-full"
            inquiry={{
              source: "services-360-section",
              sourceLabel: "360 enterijer sekcija",
              serviceType: "360 enterijeri",
            }}
          >
            Zatraži ponudu za 360 enterijer
          </QuickInquiryLink>
        </div>
      </section>

      {/* ─── Before/After Showcase ─────────────────────── */}
      <section className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <div className="space-y-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-accent">
              Pre i posle
            </p>
            <h2 className="font-heading text-3xl leading-tight text-foreground md:text-4xl">
              Transformacija koja se <span className="text-accent">odmah vidi</span>
            </h2>
          </div>
          <p className="text-base leading-relaxed text-muted-foreground">
            Staging, renovacija i obrada fotografija — usluge gde vizuelni dokaz
            promene govori više od opisa.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COMPARE_SHOWCASE.map((item) => (
            <article
              key={item.title}
              className="overflow-hidden rounded-2xl border border-border/40 bg-card/80 shadow-[0_12px_40px_rgba(28,26,25,0.06)]"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={ARTWORK.beforeAfter}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: item.position }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/15" />
                <div className="absolute left-3 top-3 flex overflow-hidden rounded-full border border-white/50 bg-white/90 text-[0.72rem] font-semibold uppercase tracking-wider shadow-sm backdrop-blur">
                  <span className="border-r border-border/20 px-2.5 py-1 text-muted-foreground">Pre</span>
                  <span className="bg-accent/12 px-2.5 py-1 text-accent">Posle</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-heading text-xl text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </div>
            </article>
          ))}
        </div>
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
              alt="3D osnova prostora"
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
            { icon: BadgeEuro, title: "2. Dobijete predlog", text: "Preporuka usluge, cena i obim koji ima smisla." },
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
                {item.answer}
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
                href="/cene"
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
