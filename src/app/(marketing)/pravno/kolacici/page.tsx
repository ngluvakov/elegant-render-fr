import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { ConsentSettingsLink } from "@/components/site/consent-settings-link";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Politika kolačića",
  description: `Koje kolačiće i slične tehnologije koristi ${SITE.name} i kako da kontrolišete svoj izbor.`,
  path: "/pravno/kolacici",
});

const LAST_UPDATED = "2026-05-20";

type CookieEntry = {
  name: string;
  storage: string;
  provider: string;
  purpose: string;
  retention: string;
};

const NECESSARY: CookieEntry[] = [
  {
    name: "next-auth.session-token",
    storage: "Cookie",
    provider: "Elegant Render (Auth.js)",
    purpose: "Održavanje aktivne sesije nakon prijave.",
    retention: "Do odjave ili 30 dana",
  },
  {
    name: "next-auth.csrf-token",
    storage: "Cookie",
    provider: "Elegant Render (Auth.js)",
    purpose:
      "Zaštita od cross-site request forgery napada na obrasce za prijavu.",
    retention: "Sesija pretraživača",
  },
  {
    name: "next-auth.callback-url",
    storage: "Cookie",
    provider: "Elegant Render (Auth.js)",
    purpose: "Pamti gde je posetilac otišao posle prijave.",
    retention: "Sesija pretraživača",
  },
  {
    name: "er-country",
    storage: "Cookie",
    provider: "Elegant Render",
    purpose:
      "Zemlja posetioca radi prikaza cena u odgovarajućoj valuti (RSD ili EUR).",
    retention: "30 dana",
  },
  {
    name: "er-consent",
    storage: "localStorage",
    provider: "Elegant Render",
    purpose: "Čuvanje izbora kolačića koji ste napravili u banner-u.",
    retention: "Do brisanja u podešavanjima pretraživača",
  },
];

const ANALYTICS: CookieEntry[] = [
  {
    name: "ph_*",
    storage: "Cookie + localStorage",
    provider: "PostHog Inc.",
    purpose:
      "Anonimni distinct ID i session ID za agregatne statistike o tome kako se sajt koristi.",
    retention: "Do 12 meseci",
  },
  {
    name: "sentry-* (trace)",
    storage: "Cookie",
    provider: "Sentry (Functional Software, Inc.)",
    purpose: "Praćenje performansi i grešaka u aplikaciji.",
    retention: "Sesija pretraživača",
  },
  {
    name: "_ga, _ga_*",
    storage: "Cookie",
    provider: "Google Analytics 4",
    purpose:
      "Agregatno merenje poseta, izvora saobraćaja i korišćenja stranica nakon saglasnosti za analitiku.",
    retention: "Do 24 meseca",
  },
  {
    name: "Google Tag Manager",
    storage: "Script + dataLayer",
    provider: "Google Tag Manager",
    purpose:
      "Upravljanje mernim tagovima i slanje dataLayer događaja nakon saglasnosti za analitiku. Sam po sebi ne postavlja kolačiće.",
    retention: "Tokom učitane stranice",
  },
];

const MARKETING: CookieEntry[] = [
  {
    name: "LinkedIn Insight Tag",
    storage: "Script + pixel request",
    provider: "LinkedIn",
    purpose:
      "Merenje uspešnosti LinkedIn kampanja, konverzija, poseta stranica i publike nakon saglasnosti za marketing.",
    retention: "Pseudonimizovani podaci do 180 dana",
  },
  {
    name: "lms_analytics, AnalyticsSyncHistory, UserMatchHistory, li_fat_id, li_sugr, _guid",
    storage: "Cookie + first-party identifier",
    provider: "LinkedIn",
    purpose:
      "Povezivanje posete sa LinkedIn oglasima, attribution i audience matching nakon saglasnosti za marketing.",
    retention:
      "Uglavnom 30-90 dana; pojedini LinkedIn cookies mogu trajati do 1 godine",
  },
];

const RECORDING: CookieEntry[] = [
  {
    name: "ph_session_*",
    storage: "Cookie + IndexedDB",
    provider: "PostHog Inc.",
    purpose:
      "Anonimno snimanje kretanja po sajtu (klikovi, scroll). Tekstualni unosi se maskiraju.",
    retention: "Do 12 meseci",
  },
  {
    name: "Sentry Replay",
    storage: "Cookie + IndexedDB",
    provider: "Sentry (Functional Software, Inc.)",
    purpose:
      "Snimanje sesije oko trenutka greške, da bismo mogli da reprodukujemo problem.",
    retention: "30 dana",
  },
];

export default function KolaciciPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Pravno</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Politika kolačića
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Poslednje ažuriranje:{" "}
          {new Date(LAST_UPDATED).toLocaleDateString("sr-Latn-RS", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>

        <div className="mt-8 rounded-xl border border-[color:var(--color-clay-deep)]/30 bg-[color:var(--color-clay)]/8 p-5 text-sm leading-relaxed text-foreground/80">
          <strong className="text-foreground">Napomena.</strong> Ovaj dokument
          je radna verzija. Pre javne upotrebe biće predat na pravni pregled.
          Ako primetite da neka od ovde navedenih tehnologija više ne radi
          onako kako je opisana, javite nam se na{" "}
          <a
            href={`mailto:${IMPRINT.privacyEmail}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            {IMPRINT.privacyEmail}
          </a>
          .
        </div>

        <Section title="1. Šta su kolačići i slične tehnologije">
          <p>
            Kolačići (cookies) su mali tekstualni fajlovi koje sajt smešta u
            vaš pretraživač kada ga posetite. Slične tehnologije koje
            koristimo uključuju <strong>localStorage</strong>,{" "}
            <strong>sessionStorage</strong> i <strong>IndexedDB</strong> — sve
            su to lokalni mehanizmi za čuvanje podataka u pretraživaču, koji
            ne napuštaju vaš uređaj sami od sebe.
          </p>
          <p>
            Sajt {SITE.name} koristi tri kategorije ovih tehnologija. U
            nastavku je tačan popis svake.
          </p>
        </Section>

        <Section title="2. Vaš izbor">
          <p>
            Pri prvoj poseti sajtu prikazujemo vam banner sa tri opcije:
            Prihvati sve, Samo neophodne ili Podešavanja sa pojedinačnim
            uključivanjem analitike, marketinga i snimanja sesija. Vaš izbor
            možete u svakom trenutku promeniti preko linka{" "}
            <ConsentSettingsLink className="text-foreground underline-offset-4 hover:underline" />
            {" "}u podnožju ili klikom ovde:{" "}
            <ConsentSettingsLink className="text-foreground underline-offset-4 hover:underline" />
            .
          </p>
          <p>
            Vercel Web Analytics i Speed Insights koristimo za osnovnu,
            agregatnu metriku poseta i performansi bez postavljanja kolačića u
            vaš pretraživač. Bez vašeg pristanka, tehnologije iz kategorija{" "}
            <em>Analitika</em>, <em>Marketing</em> i <em>Snimanje sesija</em>{" "}
            se ne aktiviraju — PostHog, Google Analytics 4, Google Tag
            Manager, LinkedIn Insight Tag i Sentry se inicijalizuju tek nakon
            vaše izričite saglasnosti.
          </p>
        </Section>

        <CookieCategorySection
          title="3. Neophodni"
          subtitle="Bez ovih sajt ne radi — prijava, sigurnost, čuvanje izbora kolačića. Ne tražimo saglasnost jer obrada počiva na izvršenju ugovora i legitimnom interesu."
          entries={NECESSARY}
        />

        <Section title="4. Osnovna metrika bez kolačića">
          <p>
            Na Vercelu pratimo agregatne signale kao što su broj pregleda
            stranica, izvor posete, zemlja na nivou geolokacije i Core Web
            Vitals performanse po ruti. Ovaj sloj ne koristi kolačiće,
            localStorage, sessionStorage ili snimanje sesija.
          </p>
          <p>
            Detaljnije ponašanje korisnika, funnel događaji, izveštaji o
            greškama, marketinško merenje i snimanje sesija ostaju odvojeni:
            PostHog, Google Analytics 4, Google Tag Manager, LinkedIn Insight
            Tag i Sentry se uključuju samo ako izaberete odgovarajuću
            saglasnost.
          </p>
        </Section>

        <CookieCategorySection
          title="5. Analitika"
          subtitle="Anonimne statistike koje nam pomažu da popravimo iskustvo. Aktiviraju se tek uz saglasnost."
          entries={ANALYTICS}
        />

        <CookieCategorySection
          title="6. Marketing"
          subtitle="Merenje kampanja i konverzija. Aktivira se tek uz zasebnu marketing saglasnost."
          entries={MARKETING}
        />

        <CookieCategorySection
          title="7. Snimanje sesija"
          subtitle="Anonimna snimanja kretanja po stranicama, posebno korisna oko grešaka. Tekstualni unosi i osetljive forme se maskiraju. Aktiviraju se uz zasebnu saglasnost."
          entries={RECORDING}
        />

        <Section title="8. Kontrola u pretraživaču">
          <p>
            Pored banner-a na sajtu, sve kolačiće možete da pregledate i
            obrišete u podešavanjima vašeg pretraživača. Linkovi ka
            uputstvima za najpopularnije pretraživače:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Google Chrome
              </a>
            </li>
            <li>
              <a
                href="https://support.mozilla.org/sr/kb/Brisanje%20kolacica"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a
                href="https://support.apple.com/sr-rs/guide/safari/sfri11471/mac"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Apple Safari
              </a>
            </li>
            <li>
              <a
                href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Microsoft Edge
              </a>
            </li>
          </ul>
        </Section>

        <Section title="9. Više informacija">
          <p>
            Detalji o tome kako obrađujemo lične podatke i kome se obraćate
            ako imate pitanja nalaze se u{" "}
            <Link
              href="/pravno/privatnost"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Politici privatnosti
            </Link>
            .
          </p>
        </Section>
      </article>
      <FinalCta />
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl text-foreground">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground/75">
        {children}
      </div>
    </section>
  );
}

function CookieCategorySection({
  title,
  subtitle,
  entries,
}: {
  title: string;
  subtitle: string;
  entries: CookieEntry[];
}) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl text-foreground">{title}</h2>
      <p className="mt-3 text-base leading-relaxed text-foreground/70">
        {subtitle}
      </p>
      <div className="-mx-2 mt-5 overflow-x-auto sm:mx-0">
        <table className="min-w-full text-sm">
          <thead className="text-left text-[0.78rem] uppercase tracking-[0.16em] text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="px-2 py-3">Naziv</th>
              <th className="px-2 py-3">Tip</th>
              <th className="px-2 py-3">Dobavljač</th>
              <th className="px-2 py-3">Svrha</th>
              <th className="px-2 py-3">Trajanje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-foreground/80">
            {entries.map((e) => (
              <tr key={e.name}>
                <td className="px-2 py-3 align-top">
                  <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-[0.78rem]">
                    {e.name}
                  </code>
                </td>
                <td className="px-2 py-3 align-top text-muted-foreground">
                  {e.storage}
                </td>
                <td className="px-2 py-3 align-top">{e.provider}</td>
                <td className="px-2 py-3 align-top">{e.purpose}</td>
                <td className="px-2 py-3 align-top text-muted-foreground">
                  {e.retention}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
