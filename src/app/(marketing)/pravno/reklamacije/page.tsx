import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Politika reklamacija",
  description: `Politika reklamacija ${SITE.name} — kako prijaviti reklamaciju, rokovi za odgovor, šta sve obuhvata.`,
  path: "/pravno/reklamacije",
});

const LAST_UPDATED = "2026-05-29";

export default function ReklamacijePage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Pravno</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Politika reklamacija
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Poslednje ažuriranje:{" "}
          {new Date(LAST_UPDATED).toLocaleDateString("sr-Latn-RS", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>

        <Section title="1. Pravo na reklamaciju">
          <p>
            U skladu sa Zakonom o zaštiti potrošača (čl. 55–58), ako naša
            usluga ne odgovara opisu, ima nedostatak u izvedbi koji nije bio
            predviđen specifikacijom, ili je isporučena nakon ugovorenog roka,
            imate pravo da podnesete reklamaciju.
          </p>
          <p>
            Reklamacija se podnosi u roku od <strong>dva (2) meseca</strong>{" "}
            od trenutka isporuke. Za usaglašene digitalne sadržaje (renderi,
            animacije, AI obrade) prihvatamo reklamacije i izvan tog roka u
            okviru tri runde revizija koje su uključene u svaku porudžbinu.
          </p>
        </Section>

        <Section title="2. Kako podnosite reklamaciju">
          <ol className="list-inside list-decimal space-y-2">
            <li>
              Pošaljite email na{" "}
              <a
                href={`mailto:${IMPRINT.email}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                {IMPRINT.email}
              </a>{" "}
              sa brojem porudžbine (vidljiv u portalu i potvrdama plaćanja) i
              jasnim opisom problema.
            </li>
            <li>
              Priložite snimke ekrana ili reference koje pomažu da razumemo
              šta nije u redu — što jasniji opis, brža reakcija.
            </li>
            <li>
              Ako se reklamacija odnosi na transakciju plaćenu karticom,
              navedite identifikator transakcije (TransId) sa potvrde o
              plaćanju koju ste primili emailom.
            </li>
          </ol>
        </Section>

        <Section title="3. Naš odgovor i rok">
          <p>
            Pisani odgovor sa odlukom o reklamaciji dostavljamo u roku od{" "}
            <strong>osam (8) dana</strong> od prijema reklamacije, u skladu sa
            članom 56. stavom 8. Zakona o zaštiti potrošača.
          </p>
          <p>
            Ako se reklamacija prihvati: o našem trošku ćemo izvršiti potrebnu
            ispravku, ili — ako ispravka nije moguća — vratiti uplaćeni iznos
            prema{" "}
            <Link
              href="/pravno/povracaj-sredstava"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Politici povraćaja sredstava
            </Link>
            .
          </p>
        </Section>

        <Section title="4. Vansudsko rešavanje">
          <p>
            Ako naš odgovor ne zadovoljava vaše očekivanje, imate pravo da se
            obratite Ministarstvu nadležnom za zaštitu potrošača Republike
            Srbije ili (za rezidente EU) EU ODR platformi:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>
        </Section>

        <p className="mt-12 text-sm text-foreground/60">
          Za detaljne uslove ugovora pogledajte{" "}
          <Link
            href="/pravno/uslovi"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Uslove korišćenja
          </Link>
          .
        </p>
      </article>
      <FinalCta />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl text-foreground">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground/75">
        {children}
      </div>
    </section>
  );
}
