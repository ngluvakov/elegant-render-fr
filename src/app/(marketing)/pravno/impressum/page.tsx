import type { Metadata } from "next";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE, formatAddress } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Impressum",
  description: `Pravni podaci pravnog lica koje stoji iza ${SITE.name} — naziv, sedište, registarski podaci, kontakt.`,
  path: "/pravno/impressum",
});

export default function ImpressumPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-20 pt-20 md:pt-28">
        <SectionKicker>Pravno</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Impressum
        </h1>
        <p className="mt-6 text-base leading-relaxed text-foreground/75">
          Sajt {SITE.url.replace(/^https?:\/\//, "")} pruža privredno društvo
          čiji su podaci u nastavku. Ovi podaci se javno objavljuju u skladu sa
          članom 7. Zakona o elektronskoj trgovini Republike Srbije i članom 5.
          Direktive 2000/31/EZ.
        </p>

        <dl className="mt-12 grid gap-x-8 gap-y-5 rounded-xl border border-border/60 bg-secondary/30 p-8 sm:grid-cols-[200px_1fr]">
          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pun naziv
          </dt>
          <dd className="text-base leading-relaxed text-foreground">
            {IMPRINT.legalName}
          </dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Skraćeni naziv
          </dt>
          <dd className="text-base text-foreground">{IMPRINT.shortName}</dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Sedište
          </dt>
          <dd className="text-base text-foreground">{formatAddress()}</dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Matični broj (MB)
          </dt>
          <dd className="font-mono text-base text-foreground">
            {IMPRINT.registryNumber}
          </dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            PIB
          </dt>
          <dd className="font-mono text-base text-foreground">{IMPRINT.taxId}</dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Šifra delatnosti
          </dt>
          <dd className="text-base text-foreground">
            {IMPRINT.activityCode} — Specijalizovane dizajnerske delatnosti
          </dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Datum osnivanja
          </dt>
          <dd className="text-base text-foreground">
            {new Date(IMPRINT.foundedAt).toLocaleDateString("sr-Latn-RS", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Veličina
          </dt>
          <dd className="text-base text-foreground">{IMPRINT.size}</dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Kontakt e-pošta
          </dt>
          <dd className="text-base">
            <a
              href={`mailto:${IMPRINT.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>
          </dd>

          <dt className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pitanja zaštite podataka
          </dt>
          <dd className="text-base">
            <a
              href={`mailto:${IMPRINT.privacyEmail}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.privacyEmail}
            </a>
          </dd>
        </dl>

        <h2 className="mt-16 text-2xl text-foreground">
          Predstavnik u Evropskoj uniji
        </h2>
        <p className="mt-4 text-base leading-relaxed text-foreground/75">
          {IMPRINT.shortName} je registrovano u Republici Srbiji. Pošto sajt
          nudi usluge i klijentima u zemljama Evropske unije, u skladu sa
          članom 27. Opšte uredbe o zaštiti podataka (GDPR){" "}
          <strong>postupak imenovanja predstavnika u EU je u toku</strong>. Do
          imenovanja, korisnici iz EU mogu da nas kontaktiraju direktno na{" "}
          <a
            href={`mailto:${IMPRINT.privacyEmail}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            {IMPRINT.privacyEmail}
          </a>{" "}
          za sva pitanja u vezi sa obradom ličnih podataka, kao i nadležnom
          nadzornom organu zemlje u kojoj imaju prebivalište.
        </p>

        <h2 className="mt-16 text-2xl text-foreground">Registracioni podaci</h2>
        <p className="mt-4 text-base leading-relaxed text-foreground/75">
          {IMPRINT.shortName} je upisan u registar privrednih društava Agencije
          za privredne registre (APR) Republike Srbije. Javni podaci o društvu
          dostupni su pretragom matičnog broja na{" "}
          <a
            href={`https://pretraga2.apr.gov.rs/unifiedentitysearch/Search/Details/${IMPRINT.registryNumber}`}
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline-offset-4 hover:underline"
          >
            pretraga2.apr.gov.rs
          </a>
          .
        </p>

        <h2 className="mt-16 text-2xl text-foreground">Nadzorni organi</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-foreground/75">
          <li>
            <strong>Ministarstvo trgovine, turizma i telekomunikacija</strong>{" "}
            — nadzor nad elektronskom trgovinom
          </li>
          <li>
            <strong>
              Poverenik za informacije od javnog značaja i zaštitu podataka o
              ličnosti
            </strong>{" "}
            — nadzor nad obradom ličnih podataka u Srbiji (
            <a
              href="https://www.poverenik.rs"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              poverenik.rs
            </a>
            )
          </li>
        </ul>
      </article>
      <FinalCta />
    </>
  );
}
