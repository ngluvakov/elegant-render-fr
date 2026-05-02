import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Brush,
  CheckCircle2,
  CircleDollarSign,
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
import {
  AI_CREDIT_TIERS,
  AI_EDIT_TYPES,
  calculateAiCreditPurchase,
  formatCents,
  formatCreditsFromUnits,
  type AiEditType,
} from "@/lib/ai-studio/catalog";

export const metadata: Metadata = {
  title: "AI Studio",
  description:
    "Brza AI obrada fotografija nekretnina: uklanjanje elemenata, dan-u-noć, zamena neba, boja zidova, staging, renovacija i redesign.",
  openGraph: {
    title: "AI Studio — Elegant Render",
    description:
      "Uploadujte fotografiju, izaberite AI alat i dobijte rezultat za oglas, prezentaciju ili proveru ideje.",
    url: "/ai-studio",
  },
};

type ToolDetail = {
  icon: LucideIcon;
  benefit: string;
  input: string;
  output: string;
  prompt: string;
  mediaLabel: string;
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
    mediaLabel: "Clean-up",
  },
  day_to_dusk: {
    icon: Sun,
    benefit:
      "Pretvorite dnevni kadar u večernju atmosferu koja daje topliji prvi utisak.",
    input: "Fotografija + atmosfera",
    output: "Sutonski ili noćni kadar",
    prompt:
      "Suptilan plavi sat, topla svetla iz prozora, ne menjati boju fasade.",
    mediaLabel: "Dusk",
  },
  sky_replacement: {
    icon: CloudSun,
    benefit:
      "Zadržite dobar kadar, ali zamenite sivo ili pregorelo nebo boljom atmosferom.",
    input: "Eksterijer sa vidljivim nebom",
    output: "Fotografija sa boljim nebom",
    prompt:
      "Blago oblačno nebo, ne menjati boju zgrade ni ekspoziciju fasade.",
    mediaLabel: "Sky",
  },
  wall_color_change: {
    icon: Paintbrush,
    benefit:
      "Testirajte novu boju zida pre nego što prostor zaista prefarbate.",
    input: "Fotografija + ciljna boja",
    output: "Nova boja zida",
    prompt:
      "Promeni samo zid iza kreveta. Plafon, lajsne i nameštaj ostaju isti.",
    mediaLabel: "Wall color",
  },
  virtual_staging: {
    icon: Sofa,
    benefit:
      "Prazan prostor pretvorite u sobu koju kupac odmah razume i emotivno čita.",
    input: "Fotografija + tip sobe + stil",
    output: "Opremljen prostor",
    prompt:
      "Dnevna soba, topao moderni stil, neutralna paleta, drvo i svetli tekstil.",
    mediaLabel: "Staging",
  },
  virtual_renovation: {
    icon: Wand2,
    benefit:
      "Prikažite potencijal renovacije pre skupih odluka o materijalima i radovima.",
    input: "Fotografija + šta menjamo + stil",
    output: "Renovirana varijanta",
    prompt:
      "Zameni pod hrastovim parketom, zidovi topla bela, ostavi raspored kuhinje.",
    mediaLabel: "Renovation",
  },
  room_redesign: {
    icon: Palette,
    benefit:
      "Promenite stil i atmosferu postojeće sobe bez kompletnog 3D projekta.",
    input: "Fotografija + tip sobe + stil",
    output: "Nova dizajnerska varijanta",
    prompt:
      "Svetli skandinavski stil, manje vizuelnog nereda, zadržati prozore i osnovni raspored.",
    mediaLabel: "Redesign",
  },
};

const heroImages = [
  {
    src: "/artwork/elegant-render-virtual-staging-scene.webp",
    label: "Virtual staging",
  },
  {
    src: "/artwork/elegant-render-services-before-after-grid.webp",
    label: "Pre / posle",
  },
  {
    src: "/artwork/elegant-render-hero-interior.webp",
    label: "Enterijer",
  },
  {
    src: "/artwork/elegant-render-feature-exterior.webp",
    label: "Eksterijer",
  },
];

const workflow = [
  {
    icon: Upload,
    title: "Uploadujte fotografiju",
    text: "JPG, PNG ili WebP do 50 MB. Najbolje rade jasni, široki kadrovi.",
  },
  {
    icon: Sparkles,
    title: "Izaberite AI alat",
    text: "Od brzih korekcija do staginga, renovacije i redesign-a.",
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
    image: "/artwork/cene-card-opremanje-renovacija.webp",
  },
];

const tips = [
  "Uploadujte jasnu fotografiju; što bolja rezolucija, to bolji rezultat.",
  "Napišite šta mora da ostane isto: prozori, raspored, pod, materijali.",
  "Ne tražite više nepovezanih stvari u jednoj rečenici.",
  "Za staging navedite namenu sobe, stil i paletu boja.",
  "Za renovaciju odvojite materijale, nameštaj i osvetljenje.",
  "Za uklanjanje većih predmeta koristite masku u Advanced mode-u.",
  "Ako je rezultat blizu dobrog, koristite ga kao novi ulaz i tražite malu korekciju.",
];

const faq = [
  {
    question: "Da li AI Studio pravi 3D render?",
    answer:
      "Ne. AI Studio obrađuje postojeće fotografije. Ako prostor ne postoji ili treba potpuno kontrolisan arhitektonski prikaz, bolji izbor je klasičan render.",
  },
  {
    question: "Kada treba koristiti masku?",
    answer:
      "Masku koristite kada želite da se izmena desi samo na delu slike: veći predmet, određeni zid, deo poda ili zona prostorije.",
  },
  {
    question: "Koja je razlika između staginga, renovacije i redesign-a?",
    answer:
      "Staging dodaje opremu u prazan prostor. Renovacija menja materijale i elemente prostora. Redesign menja stil i atmosferu postojeće sobe.",
  },
  {
    question: "Da li rezultat mogu ponovo da obradim?",
    answer:
      "Da. Rezultat može da postane nova ulazna slika za malu korekciju ili nastavak dorade.",
  },
];

const creditPackages = [10, 25, 50, 100];
const creditTiers = [...AI_CREDIT_TIERS].reverse();

export default function AiStudioLandingPage() {
  return (
    <>
      <HeroSection />
      <WorkflowSection />
      <ToolsSection />
      <ScenarioSection />
      <ComparisonSection />
      <CreditsSection />
      <TipsSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/artwork/elegant-render-virtual-staging-scene.webp"
          alt=""
          fill
          priority
          className="object-cover object-[center_58%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(28,26,25,0.86)_0%,rgba(28,26,25,0.62)_42%,rgba(28,26,25,0.26)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-[min(96vw,1720px)] flex-col justify-center px-6 py-12 md:py-16">
        <div className="max-w-3xl">
          <SectionKicker className="[&_span:last-child]:text-white/72">
            AI Studio
          </SectionKicker>
          <h1 className="mt-4 text-4xl leading-[1.02] text-white md:text-6xl lg:text-7xl">
            Brza AI obrada fotografija za nekretnine
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/78 md:text-lg">
            Uploadujte fotografiju, izaberite alat i dobijte spreman vizuelni
            rezultat za oglas, prezentaciju ili proveru ideje.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/portal/ai-studio" variant="accent" size="lg">
              Otvori AI Studio
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink
              href="/portal/ai-studio/krediti"
              variant="outline"
              size="lg"
              className="border-white/45 bg-white/8 text-white hover:bg-white/14"
            >
              <Coins className="h-4 w-4" />
              Kupi kredite
            </ButtonLink>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/72">
            {[
              "Simple obrada = 0.5 kredita",
              "Complex obrada = 1 kredit",
              "Krediti važe 12 meseci",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {heroImages.map((item) => (
            <div
              key={item.src}
              className="overflow-hidden rounded-lg border border-white/20 bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur"
            >
              <Image
                src={item.src}
                alt=""
                width={520}
                height={330}
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="px-3 py-2 text-xs font-semibold text-white/80">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="max-w-2xl">
          <SectionKicker>Kako radi</SectionKicker>
          <h2 className="mt-3 text-3xl text-foreground md:text-5xl">
            Od fotografije do upotrebljivog vizuala u četiri koraka.
          </h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflow.map((item, index) => (
            <div
              key={item.title}
              className="rounded-lg border border-border/60 bg-card/80 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-sm font-semibold text-accent">
                  0{index + 1}
                </span>
                <item.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ToolsSection() {
  return (
    <section className="bg-secondary/35 py-16 md:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <SectionKicker>Alati</SectionKicker>
            <h2 className="mt-3 text-3xl text-foreground md:text-5xl">
              Sedam AI obrada za postojeće fotografije.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Svaki alat ima jasan opseg: od brzog čišćenja fotografije do
              staginga, renovacije i redesign-a prostorije.
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
                className="flex min-h-full flex-col rounded-lg border border-border/60 bg-background p-5"
              >
                <div className="rounded-lg border border-dashed border-border/70 bg-secondary/45 p-3">
                  <div className="flex items-center justify-between gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <span>Input</span>
                    <span>{detail.mediaLabel}</span>
                    <span>Output</span>
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="aspect-[4/3] rounded-md bg-background/75 ring-1 ring-border/50" />
                    <ArrowRight className="h-4 w-4 text-accent" />
                    <div className="aspect-[4/3] rounded-md bg-[color:var(--color-sage)]/18 ring-1 ring-[color:var(--color-sage)]/30" />
                  </div>
                </div>

                <div className="mt-5 flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/12 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <span className="rounded-full bg-accent/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-accent">
                      {item.complexity === "simple" ? "Simple" : "Complex"} ·{" "}
                      {formatCreditsFromUnits(item.units)}
                    </span>
                    {capabilities.length > 0 && (
                      <span className="rounded-full bg-[color:var(--color-sage)]/15 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[color:var(--color-sage-deep)]">
                        {capabilities.join(" · ")}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="mt-4 text-xl font-semibold text-foreground">
                  {item.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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

                <p className="mt-4 rounded-lg bg-secondary/50 px-3 py-2 text-xs leading-relaxed text-foreground/78">
                  “{detail.prompt}”
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
    <section className="py-16 md:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="max-w-2xl">
          <SectionKicker>Scenariji</SectionKicker>
          <h2 className="mt-3 text-3xl text-foreground md:text-5xl">
            Tri najčešća razloga za AI obradu.
          </h2>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {scenarios.map((item) => (
            <article
              key={item.title}
              className="overflow-hidden rounded-lg border border-border/60 bg-card/80"
            >
              <Image
                src={item.image}
                alt=""
                width={720}
                height={460}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-5">
                <h3 className="text-xl font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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

function ComparisonSection() {
  return (
    <section className="bg-secondary/35 py-16 md:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="max-w-2xl">
          <SectionKicker>Kada šta koristiti</SectionKicker>
          <h2 className="mt-3 text-3xl text-foreground md:text-5xl">
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
              "Cena: od €1 po jednostavnoj obradi",
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
    <article className="rounded-lg border border-border/60 bg-background p-6">
      <div className="flex items-center gap-3">
        <span
          className={
            accent
              ? "flex h-10 w-10 items-center justify-center rounded-lg bg-accent/12 text-accent"
              : "flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/8 text-foreground"
          }
        >
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
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
          href="/usluge"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
        >
          Pogledajte usluge renderinga
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </article>
  );
}

function CreditsSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto grid w-full max-w-[min(96vw,1720px)] gap-8 px-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <SectionKicker>Krediti</SectionKicker>
          <h2 className="mt-3 text-3xl text-foreground md:text-5xl">
            Kupite koliko vam treba.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Krediti važe 12 meseci od poslednje dopune. Veći paketi imaju nižu
            cenu po kreditu, a sistem automatski primenjuje najbolju cenu za
            izabranu količinu.
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
          <ButtonLink
            href="/portal/ai-studio/krediti"
            variant="accent"
            size="lg"
            className="mt-7"
          >
            Kupi kredite
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>

        <div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {creditPackages.map((credits) => {
              const purchase = calculateAiCreditPurchase(credits);
              return (
                <div
                  key={credits}
                  className="rounded-lg border border-border/60 bg-card/80 p-5"
                >
                  <p className="text-4xl font-bold text-foreground">
                    {credits}
                  </p>
                  <p className="text-sm text-muted-foreground">kredita</p>
                  <p className="mt-5 text-2xl font-semibold text-foreground">
                    {formatCents(purchase.totalCents)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCents(purchase.centsPerCredit)} po kreditu
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
                  {label}: {formatCents(tier.centsPerCredit)}/kredit
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
    <section className="bg-secondary/35 py-16 md:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="max-w-2xl">
          <SectionKicker>Saveti</SectionKicker>
          <h2 className="mt-3 text-3xl text-foreground md:text-5xl">
            Za bolji rezultat, recite AI-ju šta treba da ostane isto.
          </h2>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tips.map((tip) => (
            <div
              key={tip}
              className="flex gap-3 rounded-lg border border-border/60 bg-background p-4"
            >
              <Lightbulb className="mt-0.5 h-4 w-4 flex-none text-accent" />
              <p className="text-sm leading-relaxed text-foreground/82">
                {tip}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6">
        <div className="max-w-2xl">
          <SectionKicker>Česta pitanja</SectionKicker>
          <h2 className="mt-3 text-3xl text-foreground md:text-5xl">
            Sve što treba da znate pre prve obrade.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {faq.map((item) => (
            <article
              key={item.question}
              className="rounded-lg border border-border/60 bg-card/80 p-5"
            >
              <h3 className="text-lg font-semibold text-foreground">
                {item.question}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
    <section className="px-6 pb-20">
      <div className="mx-auto flex w-full max-w-[min(96vw,1720px)] flex-col items-start justify-between gap-6 rounded-lg bg-foreground p-6 text-background md:flex-row md:items-center md:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-background/60">
            AI Studio
          </p>
          <h2 className="mt-2 text-3xl md:text-4xl">
            Spremni za prvu obradu fotografije?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-background/72">
            Počnite sa jednom jasnom fotografijom. Ako niste sigurni koji alat
            je pravi, krenite od cilja: očistiti, opremiti, renovirati ili
            promeniti atmosferu.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/portal/ai-studio" variant="accent" size="lg">
            Otvori AI Studio
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink
            href="/portal/ai-studio/krediti"
            variant="outline"
            size="lg"
            className="border-background/30 text-background hover:bg-background/10"
          >
            <CircleDollarSign className="h-4 w-4" />
            Kupi kredite
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
