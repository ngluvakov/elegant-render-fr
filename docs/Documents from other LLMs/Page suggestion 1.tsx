/*
Design philosophy for this file: Transaction-first platform aligned to official Model-First Pricing.
The page must feel like a fast ordering interface, but every visible price must map to the approved price list.
Do not invent tier names, bundle prices, rush fees, or package math that does not exist in the pricing documents.
*/
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileImage,
  Grid2x2,
  Home as HomeIcon,
  Images,
  Layers3,
  RefreshCcw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

type ServiceId =
  | "interior"
  | "exterior"
  | "staging"
  | "renovation"
  | "floorplans"
  | "tour";

type VariantId = string;

type PricingVariant = {
  id: VariantId;
  title: string;
  basePriceLabel: string;
  basePriceValue: number;
  unitLabel: string;
  description: string;
  included: string;
  addOns: string[];
  note?: string;
};

type ServiceConfig = {
  id: ServiceId;
  name: string;
  shortName: string;
  baseFrom: string;
  icon: LucideIcon;
  highlight: string;
  materials: string;
  asset: string;
  philosophy: string;
  variants: PricingVariant[];
};

const services: ServiceConfig[] = [
  {
    id: "interior",
    name: "Unutrašnji renderi",
    shortName: "Enterijer",
    baseFrom: "od €170",
    icon: HomeIcon,
    highlight: "Najjasniji javni ulaz za stanove, kuće, apartmane i manje stambene projekte",
    materials: "Pošalji osnovu, reference, stil i spisak prostorija. Ako postoji više spratova, svaki sprat se računa zasebno.",
    asset:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-hero-01-cof6RpY9ycfwrFhhZguZbn.webp",
    philosophy:
      "Kod enterijera javna cena ne kreće od broja kadrova, već od osnovnog model-first paketa po spratu. Time kupac odmah zna da prvi korak pokriva baznu izgradnju scene, a dodatni obim se dodaje jasno i transparentno.",
    variants: [
      {
        id: "interior-static",
        title: "Static Interior — per floor",
        basePriceLabel: "€170",
        basePriceValue: 170,
        unitLabel: "osnovni paket po spratu",
        description:
          "Najbolja početna tačka za prikaz enterijera kada želiš kompletan start za jedan sprat bez izmišljanja paketa.",
        included: "Do 10 opremljenih soba, neograničen broj kamera i floor plan.",
        addOns: [
          "11. i svaka sledeća opremljena soba: €28",
          "Dodatni sprat: €120",
          "Ako želiš 360 logiku umesto statike, bira se poseban 360 paket",
        ],
      },
      {
        id: "interior-360",
        title: "360 Interior — per floor",
        basePriceLabel: "€295",
        basePriceValue: 295,
        unitLabel: "360 paket po spratu",
        description:
          "Za interaktivniji prikaz kada jedan statički set nije dovoljan i želiš kombinaciju hotspotova i statika.",
        included: "Do 10 hotspot soba, 10 statičkih kamera i floor plan.",
        addOns: [
          "11. i svaka sledeća hotspot soba: €45",
          "Dodatni hotspot u postojećoj sobi: €27",
          "Dodatna statička kamera: €10",
          "Dodatni sprat (360): €205",
        ],
      },
    ],
  },
  {
    id: "exterior",
    name: "Spoljašnji renderi",
    shortName: "Eksterijer",
    baseFrom: "od €250",
    icon: Grid2x2,
    highlight: "Za kuće, objekte, fasade i manje investicione prezentacije sa jasnom logikom prvog i dodatnih prikaza",
    materials: "Pošalji osnove, fasade, skice, reference i napiši da li želiš statični, 360 ili aerial prikaz.",
    asset:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-portfolio-01-HpiHZcQXFq7MF3BnppeqJc.webp",
    philosophy:
      "Kod eksterijera prvi render nosi pun trošak izgradnje modela. Svaki sledeći ugao iz istog modela ide po nižoj ceni, a dodatna doplata postoji samo ako novi kadar traži geometriju koja ranije nije bila modelovana.",
    variants: [
      {
        id: "exterior-static",
        title: "Static Exterior",
        basePriceLabel: "€250",
        basePriceValue: 250,
        unitLabel: "prvi kadar",
        description:
          "Osnovni javni ulaz za jedan kompletan statični eksterijerski prikaz sa prvim uglom kamere.",
        included: "Kompletan 3D model i prvi ugao kamere.",
        addOns: [
          "Dodatna kamera sa iste strane modela: €48",
          "Extended model surcharge: +25% jednom po modelu kada nova kamera traži neviđenu geometriju",
        ],
        note:
          "Kada se extended model surcharge jednom plati, model se smatra dovršenim i naredne kamere ulaze u standardnu dodatnu cenu.",
      },
      {
        id: "exterior-360",
        title: "360 Exterior",
        basePriceLabel: "€335",
        basePriceValue: 335,
        unitLabel: "prvi 360 prikaz",
        description:
          "Za projekte gde kupac treba da dobije interaktivniji pregled spoljnog prostora iz jednog modela.",
        included: "Pun model i prvi VR-ready 360 output.",
        addOns: [
          "Dodatni hotspot, ista strana modela: €48",
          "Extended model hotspot: €60",
          "Volume rate nakon 4 dodatna hotspota: €53 po hotspotu",
        ],
      },
      {
        id: "exterior-aerial",
        title: "Aerial Exterior",
        basePriceLabel: "€420",
        basePriceValue: 420,
        unitLabel: "aerial prikaz",
        description:
          "Za projekte gde je važan širi kontekst parcele, objekta i okruženja.",
        included: "Pun model i okruženje za aerial pogled.",
        addOns: ["Aerial extended model prikaz zadnje strane: +25%"],
      },
    ],
  },
  {
    id: "staging",
    name: "Virtuelno opremanje",
    shortName: "Virtual staging",
    baseFrom: "od €18",
    icon: Sparkles,
    highlight: "Najbrža ulazna cena za listing upgrade kada već postoji fotografija prostora",
    materials: "Pošalji praznu ili slabo uređenu fotografiju prostora i napiši željeni stil.",
    asset:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-services-01-LuNQfFVpbhKVCFf7cXAbYJ.webp",
    philosophy:
      "Virtual staging se ne predstavlja kroz izmišljene bundle pakete, već kroz cenu prve slike i niže cene za dodatne uglove ili dodatne prostorije iste nekretnine.",
    variants: [
      {
        id: "staging-static",
        title: "Static Staging",
        basePriceLabel: "€18",
        basePriceValue: 18,
        unitLabel: "prva slika",
        description:
          "Javni početak za jednu staged fotografiju kada kupcu treba brz i jasan vizuelni upgrade oglasa.",
        included: "Analiza sobe, odabir nameštaja, raspored i svetlo za prvu sliku.",
        addOns: [
          "Dodatni ugao iste sobe: €12",
          "Druga soba iste nekretnine: €15",
          "Nakon 10 slika: €13 po slici",
          "Re-staging u drugom stilu: €12",
        ],
      },
      {
        id: "staging-360",
        title: "360 Staging",
        basePriceLabel: "€34",
        basePriceValue: 34,
        unitLabel: "prvi 360 hotspot",
        description:
          "Za interaktivniji staging kada prostor treba prikazati u 360 modu, a ne samo kroz statičan kadar.",
        included: "Kompletno 360 opremanje prve prostorije.",
        addOns: [
          "Dodatni hotspot iste sobe: €24",
          "Druga soba iste nekretnine: €28",
          "Nakon 6 hotspotova: €24 po hotspotu",
          "Re-staging u drugom stilu: €22",
        ],
      },
    ],
  },
  {
    id: "renovation",
    name: "Virtuelna renovacija",
    shortName: "Renovacija",
    baseFrom: "od €66",
    icon: RefreshCcw,
    highlight: "Za odluku pre realnih radova, sa cenom po prikazu i popustom kada se radi više uglova istog prostora",
    materials: "Pošalji postojeće stanje, fotografije i napiši šta želiš da se promeni u prostoru.",
    asset:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-process-01-aUsUQMZT3yMu6WtsnrjA8L.webp",
    philosophy:
      "Renovacija se javno komunicira kroz cenu prve slike i niže cene za dodatne uglove istog prostora ili za više prostorija iste nekretnine. Time kupac vidi da se odluka širi postepeno, a ne kroz nejasan paket.",
    variants: [
      {
        id: "renovation-main",
        title: "Virtual Renovation",
        basePriceLabel: "€66",
        basePriceValue: 66,
        unitLabel: "prvi prikaz",
        description:
          "Javna ulazna cena za prvi renovation prikaz jednog prostora ili ključnog ugla promene.",
        included: "Pun renovation rad na prvom prikazu jednog pogleda.",
        addOns: [
          "Dodatni ugao iste sobe: €59",
          "4. i svaki sledeći ugao iste sobe: €53",
          "Druga soba iste nekretnine: €56",
          "Nakon 5 soba iste nekretnine: €50 po sobi",
        ],
      },
    ],
  },
  {
    id: "floorplans",
    name: "2D i 3D osnove prostora",
    shortName: "Osnove",
    baseFrom: "od €20",
    icon: FileImage,
    highlight: "Pregledna osnova za oglase, prodaju i planiranje, uz jasno odvojene 2D i 3D cenovne logike",
    materials: "Pošalji skicu, postojeći tlocrt ili što jasnije informacije o rasporedu prostora i nivoima.",
    asset:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-process-01-aUsUQMZT3yMu6WtsnrjA8L.webp",
    philosophy:
      "2D i 3D osnove ne smeju da se mešaju u jedan neodređen paket. Kupac mora odmah da vidi da li kupuje čistu 2D osnovu ili 3D plan sa sopstvenom logikom cena i doplata.",
    variants: [
      {
        id: "floorplan-2d-single",
        title: "2D Floor Plan",
        basePriceLabel: "€20",
        basePriceValue: 20,
        unitLabel: "single level",
        description:
          "Najniža javna ulazna cena za čistu 2D osnovu jednog nivoa.",
        included: "Jedan nivo u čistom vektorskom prikazu.",
        addOns: [
          "Double level: €32",
          "Svaki dodatni nivo: €10",
          "Duplicate floor: €6",
          "Furnished version: €6",
          "Color/style variant: €4",
        ],
      },
      {
        id: "floorplan-3d-single",
        title: "3D Floor Plan",
        basePriceLabel: "€29",
        basePriceValue: 29,
        unitLabel: "single level",
        description:
          "Javni početak za 3D osnovu kada raspored treba da bude lakši za razumevanje na prvi pogled.",
        included: "Jedan nivo u 3D floor plan prikazu.",
        addOns: [
          "Double level: €46",
          "Svaki dodatni nivo: €15",
          "Duplicate floor: €10",
          "Furniture overlay: €8",
          "Design variant: €6",
        ],
      },
    ],
  },
  {
    id: "tour",
    name: "360 ture i animacije",
    shortName: "360 / animacija",
    baseFrom: "od €20 ili €15/sec",
    icon: Images,
    highlight: "Za projekte kojima treba interaktivnost ili kretanje, ali bez mešanja dve različite logike cene u jedan paket",
    materials: "Pošalji model, osnovu ili opis prostora i napiši da li želiš 360 turu, animaciju ili oba izlaza.",
    asset:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663405648099/H5vzEpcfPDUNQp2BAKXnFZ/elegant-render-portfolio-01-HpiHZcQXFq7MF3BnppeqJc.webp",
    philosophy:
      "360 ture i animacije imaju dve odvojene komercijalne logike. Tour assembly je mali dodatak na postojeće 360 izlaze, dok animacija ima cenu po sekundi. Zato ih interfejs mora odvojiti, ne spajati u lažni bundle.",
    variants: [
      {
        id: "tour-assembly",
        title: "360 Tour Add-ons",
        basePriceLabel: "€20",
        basePriceValue: 20,
        unitLabel: "tour assembly & hosting",
        description:
          "Javni dodatak za web-based turu kada već postoji set 360 hotspotova ili se radi 360 projekat.",
        included: "Tour assembly i hosting za interaktivni prikaz.",
        addOns: [
          "Interactive floor plan navigation: €15",
          "Branded tour / white-label UI: €35",
        ],
        note:
          "Ovo nije cena za izradu 360 rendera, već dodatna vrednost na vrhu 360 sadržaja.",
      },
      {
        id: "animation-from-scratch",
        title: "Architectural Animation — from scratch",
        basePriceLabel: "€15/sec",
        basePriceValue: 15,
        unitLabel: "po sekundi",
        description:
          "Za novi animirani izlaz kada model mora da se gradi od početka i nema postojeće scene za reuse.",
        included: "Full model build i animacija.",
        addOns: [
          "Ako već postoji White Rook model: €10/sec",
          "Ako je aktivan rendering projekat: €8/sec",
          "Additional camera path: €5/sec",
          "Day/Night version: +30%",
          "Seasonal variation: +40%",
        ],
      },
    ],
  },
];

const platformPrinciples = [
  {
    title: "Šta kupujem",
    text: "Kupac bira konkretnu uslugu i odmah vidi da li polazimo od prve slike, prvog rendera, sprata, sekunde animacije ili dodatka na postojeći model.",
  },
  {
    title: "Koliko košta",
    text: "Vidljiva je zvanična početna cena iz cenovnika, a odmah ispod stoje tačne doplate za dodatni obim umesto izmišljenih paketa.",
  },
  {
    title: "Kako se cena širi",
    text: "Kada postoji model-first logika, interfejs je objašnjava: prvi izlaz pokriva glavni posao, sledeći izlazi su jeftiniji iz istog modela.",
  },
  {
    title: "Šta šaljem",
    text: "Svaka usluga ima jasno naveden minimalni ulaz: osnova, fotografije, reference ili postojeći model.",
  },
];

const trustSignals = [
  "Bez demo paketa i bez proizvoljnih cena van cenovnika.",
  "Model-first logika je vidljiva i razumljiva već iznad prevoja.",
  "Tri runde revizija ostaju deo projektnog standarda u cenovniku.",
];

const orderingSteps = [
  {
    id: "01",
    title: "Izaberi tip usluge",
    text: "Prvo biraš da li kupuješ enterijer, eksterijer, staging, renovaciju, osnovu ili 360/animaciju.",
  },
  {
    id: "02",
    title: "Izaberi tačan obračun",
    text: "Zatim biraš zvaničnu cenovnu logiku: prvi render, prvi hotspot, sprat, sekundu animacije ili tour add-on.",
  },
  {
    id: "03",
    title: "Dodaj obim projekta",
    text: "Interfejs prikazuje tačne doplate iz cenovnika za dodatne sobe, kamere, hotspotove, nivoe ili sekunde.",
  },
  {
    id: "04",
    title: "Pošalji materijale",
    text: "Kupac zatim šalje ono što je minimalno potrebno za start, bez dugog pregovaranja pre prve procene.",
  },
];

const faqs = [
  {
    question: "Zašto više nema Starter / Standard / Plus paketa?",
    answer:
      "Zato što nisu deo zvaničnog modela cena. Ovde je važnije da kupac vidi tačnu baznu cenu i tačan način kako se cena menja sa dodatnim obimom.",
  },
  {
    question: "Da li ovo znači da cena uvek ostaje ista?",
    answer:
      "Ne. Bazna cena je javna i fiksna po cenovniku, ali ukupan iznos zavisi od stvarnog obima: broja soba, dodatnih kamera, dodatnih spratova, sekundi animacije i sličnih elemenata.",
  },
  {
    question: "Da li se ovako može razviti pravi konfigurator?",
    answer:
      "Da. Ovo je dobar temelj jer već koristi istu logiku koja postoji u cenovniku i budućem kalkulatoru, umesto marketinških paketa koje bi kasnije morali da rušimo.",
  },
  {
    question: "Da li kupac i dalje može brzo da poruči?",
    answer:
      "Da. Brzina ovde ne dolazi iz sakrivanja logike, već iz toga da je cena jasna odmah i da korisnik zna koji parametri menjaju ukupan iznos.",
  },
];

export default function Home() {
  const [selectedServiceId, setSelectedServiceId] = useState<ServiceId>("interior");
  const [selectedVariantId, setSelectedVariantId] = useState<VariantId>("interior-static");

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? services[0],
    [selectedServiceId],
  );

  const selectedVariant = useMemo(() => {
    const withinService = selectedService.variants.find((variant) => variant.id === selectedVariantId);
    return withinService ?? selectedService.variants[0];
  }, [selectedService, selectedVariantId]);

  const Icon = selectedService.icon;

  const handleServiceChange = (serviceId: ServiceId) => {
    const nextService = services.find((service) => service.id === serviceId) ?? services[0];
    setSelectedServiceId(nextService.id);
    setSelectedVariantId(nextService.variants[0].id);
  };

  const handlePrimaryAction = () => {
    toast.success("Sledeći korak je order flow sa upload-om materijala i preciznim obračunom po zvaničnom cenovniku.");
  };

  const handleSecondaryAction = () => {
    toast("Ovde treba da otvorimo detaljan pricing configurator zasnovan na istom model-first cenovniku.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/40 bg-[rgba(246,241,234,0.82)] backdrop-blur-xl">
        <div className="container flex items-center justify-between gap-4 py-4">
          <a href="#top" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--er-border-strong)] bg-[rgba(255,252,248,0.85)] text-xl font-semibold text-[var(--er-coal)] shadow-[0_10px_30px_rgba(28,26,25,0.08)] font-serif">
              E
            </div>
            <div>
              <p className="text-[0.92rem] font-semibold uppercase tracking-[0.36em] text-[var(--er-coal)]">
                Elegant Render
              </p>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--er-muted)]">
                Brza kupovina arhitekturne vizuelizacije
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--er-muted)] lg:flex">
            <a href="#naruci" className="transition hover:text-[var(--er-coal)]">
              Naruči
            </a>
            <a href="#cene" className="transition hover:text-[var(--er-coal)]">
              Cene
            </a>
            <a href="#model-first" className="transition hover:text-[var(--er-coal)]">
              Kako radi cena
            </a>
            <a href="#faq" className="transition hover:text-[var(--er-coal)]">
              FAQ
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button
              variant="outline"
              className="rounded-full border-[var(--er-border-strong)] px-5 text-[var(--er-coal)]"
              onClick={handleSecondaryAction}
            >
              Pogledaj kalkulaciju
            </Button>
            <Button
              className="rounded-full bg-[var(--er-clay)] px-5 text-white shadow-[0_20px_40px_rgba(159,106,75,0.25)] hover:bg-[var(--er-clay-deep)]"
              onClick={handlePrimaryAction}
            >
              Kreni sa narudžbinom <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main id="top">
        <section id="naruci" className="relative overflow-hidden py-10 md:py-16 lg:py-20">
          <div className="container">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,460px)]">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-[rgba(255,252,248,0.74)] p-6 shadow-[0_30px_80px_rgba(28,26,25,0.08)] sm:p-8 lg:p-10 grain-soft">
                <div className="relative z-10 space-y-8">
                  <div className="space-y-5">
                    <span className="inline-flex rounded-full border border-[var(--er-border)] bg-[rgba(239,228,216,0.82)] px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[var(--er-muted)]">
                      transaction-first + model-first pricing
                    </span>
                    <h1 className="max-w-4xl text-[3rem] leading-[0.9] tracking-[-0.03em] text-[var(--er-coal)] sm:text-[4.2rem] lg:text-[5.45rem]">
                      Kupac treba da vidi <span className="text-[var(--er-clay-deep)]">tačnu baznu cenu</span>,
                      logiku doplata i sledeći korak.
                    </h1>
                    <p className="max-w-2xl text-lg leading-8 text-[var(--er-muted)]">
                      Ovaj pravac više ne imitira klasičan sajt studija. On vodi korisnika kroz
                      <strong> izbor usluge, zvaničnu početnu cenu, model-first obračun i slanje materijala</strong>,
                      tako da odluka deluje brzo, ali ostaje potpuno usklađena sa postojećim cenovnikom.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {trustSignals.map((signal) => (
                      <div
                        key={signal}
                        className="rounded-[1.5rem] border border-[var(--er-border)] bg-[rgba(246,241,234,0.84)] p-4 shadow-[0_16px_40px_rgba(28,26,25,0.05)]"
                      >
                        <BadgeCheck className="mb-3 h-5 w-5 text-[var(--er-sage-deep)]" />
                        <p className="text-sm leading-6 text-[var(--er-muted)]">{signal}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="overflow-hidden rounded-[1.8rem] border border-white/50 bg-[rgba(28,26,25,0.96)] p-5 text-white shadow-[0_24px_60px_rgba(28,26,25,0.18)]">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[0.72rem] uppercase tracking-[0.3em] text-white/55">
                            Izabrana usluga
                          </p>
                          <h2 className="mt-2 text-2xl text-white">{selectedService.name}</h2>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/8">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                      </div>

                      <p className="max-w-xl text-sm leading-7 text-white/72">{selectedService.philosophy}</p>

                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[1.25rem] border border-white/10 bg-white/6 p-4">
                          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/45">Javni start</p>
                          <p className="mt-2 text-2xl font-semibold text-white">{selectedService.baseFrom}</p>
                        </div>
                        <div className="rounded-[1.25rem] border border-white/10 bg-white/6 p-4">
                          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/45">Obračun</p>
                          <p className="mt-2 text-sm leading-6 text-white/85">{selectedVariant.unitLabel}</p>
                        </div>
                        <div className="rounded-[1.25rem] border border-white/10 bg-white/6 p-4">
                          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/45">Revizije</p>
                          <p className="mt-2 text-sm leading-6 text-white/85">3 runde uključene</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[1.8rem] border border-[var(--er-border)] bg-[rgba(246,241,234,0.88)] p-5 shadow-[0_22px_50px_rgba(28,26,25,0.07)]">
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(159,106,75,0.08),transparent_55%,rgba(113,143,120,0.08))]" />
                      <div className="relative space-y-4">
                        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[var(--er-muted)]">
                          Minimalni ulaz za start
                        </p>
                        <h3 className="text-2xl text-[var(--er-coal)]">Šta kupac šalje odmah</h3>
                        <p className="text-sm leading-7 text-[var(--er-muted)]">{selectedService.materials}</p>
                        <div className="rounded-[1.35rem] border border-[var(--er-border)] bg-white/70 p-4">
                          <img
                            src={selectedService.asset}
                            alt={selectedService.name}
                            className="h-48 w-full rounded-[1rem] object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="relative overflow-hidden rounded-[2rem] border border-[var(--er-border-strong)] bg-[rgba(255,252,248,0.95)] p-5 shadow-[0_30px_80px_rgba(28,26,25,0.12)] sm:p-6">
                <div className="space-y-6">
                  <div>
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[var(--er-muted)]">
                      Quick order panel
                    </p>
                    <h2 className="mt-3 text-3xl leading-tight text-[var(--er-coal)]">
                      Izaberi uslugu i odmah vidi tačnu logiku cene.
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.25em] text-[var(--er-muted)]">
                      1. Usluga
                    </p>
                    <div className="grid gap-2">
                      {services.map((service) => {
                        const isActive = service.id === selectedService.id;
                        const ServiceIcon = service.icon;
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => handleServiceChange(service.id)}
                            className={`group flex items-start justify-between gap-3 rounded-[1.35rem] border px-4 py-3 text-left transition ${
                              isActive
                                ? "border-[var(--er-clay)] bg-[rgba(159,106,75,0.11)] shadow-[0_16px_35px_rgba(159,106,75,0.12)]"
                                : "border-[var(--er-border)] bg-[rgba(246,241,234,0.78)] hover:border-[var(--er-border-strong)] hover:bg-white"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--er-border)] bg-white/80 text-[var(--er-coal)]">
                                <ServiceIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-[var(--er-coal)]">{service.shortName}</p>
                                <p className="mt-1 text-xs leading-5 text-[var(--er-muted)]">{service.baseFrom}</p>
                              </div>
                            </div>
                            <ChevronRight
                              className={`mt-1 h-4 w-4 transition ${
                                isActive ? "text-[var(--er-clay-deep)]" : "text-[var(--er-muted)] group-hover:text-[var(--er-coal)]"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.25em] text-[var(--er-muted)]">
                      2. Obračun iz cenovnika
                    </p>
                    <div className="grid gap-2">
                      {selectedService.variants.map((variant) => {
                        const isActive = variant.id === selectedVariant.id;
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => setSelectedVariantId(variant.id)}
                            className={`rounded-[1.35rem] border p-4 text-left transition ${
                              isActive
                                ? "border-[var(--er-sage-deep)] bg-[rgba(113,143,120,0.1)] shadow-[0_16px_35px_rgba(113,143,120,0.12)]"
                                : "border-[var(--er-border)] bg-white/72 hover:border-[var(--er-border-strong)] hover:bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold text-[var(--er-coal)]">{variant.title}</p>
                                <p className="mt-1 text-xs leading-5 text-[var(--er-muted)]">{variant.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-[var(--er-clay-deep)]">{variant.basePriceLabel}</p>
                                <p className="mt-1 text-[0.68rem] uppercase tracking-[0.18em] text-[var(--er-muted)]">
                                  {variant.unitLabel}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-[var(--er-border-strong)] bg-[rgba(28,26,25,0.97)] p-5 text-white shadow-[0_24px_60px_rgba(28,26,25,0.2)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[0.72rem] uppercase tracking-[0.25em] text-white/45">Order summary</p>
                        <h3 className="mt-2 text-2xl text-white">{selectedVariant.title}</h3>
                      </div>
                      <Calculator className="h-5 w-5 text-white/70" />
                    </div>

                    <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-white/6 p-4">
                      <p className="text-[0.72rem] uppercase tracking-[0.24em] text-white/45">Bazna javna cena</p>
                      <p className="mt-2 text-4xl font-semibold text-white">{selectedVariant.basePriceLabel}</p>
                      <p className="mt-2 text-sm leading-6 text-white/70">{selectedVariant.unitLabel}</p>
                    </div>

                    <div className="mt-4 space-y-3 text-sm leading-6 text-white/78">
                      <div>
                        <p className="font-semibold text-white">Šta je uključeno</p>
                        <p className="mt-1">{selectedVariant.included}</p>
                      </div>
                      {selectedVariant.note ? (
                        <div className="rounded-[1rem] border border-white/10 bg-white/6 p-3 text-white/72">
                          {selectedVariant.note}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-2">
                      {selectedVariant.addOns.map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-3 rounded-[1rem] border border-white/10 bg-white/6 px-3 py-2.5"
                        >
                          <Check className="mt-1 h-4 w-4 text-[var(--er-sand)]" />
                          <p className="text-sm leading-6 text-white/78">{item}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <Button
                        className="rounded-full bg-[var(--er-clay)] px-5 text-white hover:bg-[var(--er-clay-deep)]"
                        onClick={handlePrimaryAction}
                      >
                        Nastavi ka narudžbini <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full border-white/20 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white"
                        onClick={handleSecondaryAction}
                      >
                        Otvori detaljan obračun
                      </Button>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="cene" className="py-8 md:py-12 lg:py-16">
          <div className="container">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[var(--er-muted)]">
                  Cenovni interfejs za Fazu 1
                </p>
                <h2 className="text-[2.3rem] leading-tight text-[var(--er-coal)] sm:text-[3rem]">
                  Umesto marketinških paketa, kupac vidi stvarni način obračuna po usluzi.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-[var(--er-muted)]">
                Prvi nivo iskustva sada liči na servisnu platformu: bira se usluga, zatim tačan tip
                obračuna, a ispod se prikazuju stvarne doplate koje menjaju ukupnu cenu projekta.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {platformPrinciples.map((principle) => (
                <article
                  key={principle.title}
                  className="rounded-[1.8rem] border border-[var(--er-border)] bg-[rgba(255,252,248,0.78)] p-6 shadow-[0_20px_55px_rgba(28,26,25,0.05)]"
                >
                  <p className="text-sm font-semibold text-[var(--er-coal)]">{principle.title}</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--er-muted)]">{principle.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="model-first" className="py-8 md:py-12 lg:py-16">
          <div className="container">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <article className="rounded-[2rem] border border-[var(--er-border)] bg-[rgba(28,26,25,0.97)] p-6 text-white shadow-[0_30px_70px_rgba(28,26,25,0.18)] sm:p-8">
                <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/45">Model-first pricing</p>
                <h2 className="mt-4 text-[2.2rem] leading-tight text-white sm:text-[2.8rem]">
                  Prvi izlaz gradi model. Sledeći izlazi koriste taj posao i zato koštaju manje.
                </h2>
                <p className="mt-5 text-sm leading-7 text-white/72">
                  To je suština cenovne filozofije koju treba prikazati na sajtu. Kupac ne kupuje apstraktni
                  paket, već jasno razume zašto prvi render, prvi hotspot ili prvi sekund nose veću cenu,
                  a dodatni izlazi imaju nižu marginalnu cenu iz istog modela.
                </p>
              </article>

              <div className="grid gap-4 md:grid-cols-2">
                {orderingSteps.map((step) => (
                  <article
                    key={step.id}
                    className="rounded-[1.75rem] border border-[var(--er-border)] bg-[rgba(255,252,248,0.82)] p-6 shadow-[0_20px_55px_rgba(28,26,25,0.05)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--er-border)] bg-[rgba(239,228,216,0.8)] text-sm font-semibold text-[var(--er-coal)]">
                        {step.id}
                      </div>
                      <h3 className="text-lg text-[var(--er-coal)]">{step.title}</h3>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[var(--er-muted)]">{step.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12 lg:py-16">
          <div className="container">
            <div className="rounded-[2rem] border border-[var(--er-border-strong)] bg-[rgba(255,252,248,0.9)] p-6 shadow-[0_30px_80px_rgba(28,26,25,0.08)] sm:p-8">
              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[var(--er-muted)]">
                    Sledeća iteracija
                  </p>
                  <h2 className="mt-3 text-[2rem] leading-tight text-[var(--er-coal)] sm:text-[2.6rem]">
                    Odatle prelazimo na pravi konfigurator, ne na još jednu prezentaciju firme.
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-[var(--er-border)] bg-white/78 p-4">
                    <Clock3 className="mb-3 h-5 w-5 text-[var(--er-clay-deep)]" />
                    <p className="text-sm font-semibold text-[var(--er-coal)]">Kalkulacija po obimu</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--er-muted)]">
                      Sledeći korak je unos količine: broj soba, dodatnih kamera, spratova ili sekundi.
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-[var(--er-border)] bg-white/78 p-4">
                    <CircleHelp className="mb-3 h-5 w-5 text-[var(--er-sage-deep)]" />
                    <p className="text-sm font-semibold text-[var(--er-coal)]">Upload i potvrda</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--er-muted)]">
                      Posle izbora logike cene dolazi upload materijala i potvrda finalnog obračuna.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="pb-16 pt-8 md:pb-20 lg:pb-24">
          <div className="container">
            <div className="mb-8 max-w-2xl space-y-3">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[var(--er-muted)]">
                FAQ
              </p>
              <h2 className="text-[2.2rem] leading-tight text-[var(--er-coal)] sm:text-[2.8rem]">
                Pitanja koja direktno utiču na kupovnu odluku.
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {faqs.map((faq) => (
                <article
                  key={faq.question}
                  className="rounded-[1.8rem] border border-[var(--er-border)] bg-[rgba(255,252,248,0.78)] p-6 shadow-[0_20px_55px_rgba(28,26,25,0.05)]"
                >
                  <div className="flex items-start gap-3">
                    <CircleHelp className="mt-1 h-5 w-5 text-[var(--er-clay-deep)]" />
                    <div>
                      <h3 className="text-lg text-[var(--er-coal)]">{faq.question}</h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--er-muted)]">{faq.answer}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
