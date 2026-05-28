import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Politika povraćaja sredstava",
  description: `Politika povraćaja sredstava ${SITE.name} — kada i kako vraćamo uplaćeni iznos.`,
  path: "/pravno/povracaj-sredstava",
});

const LAST_UPDATED = "2026-05-29";

export default function PovracajPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Pravno</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Povraćaj sredstava
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Poslednje ažuriranje:{" "}
          {new Date(LAST_UPDATED).toLocaleDateString("sr-Latn-RS", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>

        <Section title="1. Kada vraćamo sredstva">
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Odustanak u roku od 14 dana</strong> (EU CRD čl. 9, ZZP
              čl. 27), pre nego što su radovi započeli. Pri pokretanju
              porudžbine kupac eksplicitno potvrđuje da želi da rad počne pre
              isteka 14-dnevnog roka — tim potvrdjivanjem se odustaje od ovog
              prava za pokrenute digitalne usluge.
            </li>
            <li>
              <strong>Neuspešno ili otkazano izvršenje</strong> sa naše strane
              (otkazana porudžbina pre početka rada).
            </li>
            <li>
              <strong>Prihvaćena reklamacija</strong> za koju nije moguće
              izvršiti ispravku — vidi{" "}
              <Link
                href="/pravno/reklamacije"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Politiku reklamacija
              </Link>
              .
            </li>
            <li>
              <strong>Neuspešna autorizacija kartice</strong> — u tom slučaju
              račun nije ni zadužen; ako se desi rezervacija sredstava bez
              naplate, banka izdavalac kartice automatski oslobađa rezervaciju
              u roku od najviše 7 radnih dana.
            </li>
          </ul>
        </Section>

        <Section title="2. Način povraćaja">
          <p>
            Povraćaj se vrši na <strong>isti instrument plaćanja</strong> kojim
            ste obavili uplatu. To znači:
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>
              Plaćanje karticom (Banca Intesa Nestpay) → povraćaj se inicira
              kroz Merchant Center Banca Intesa AD Beograd. Sredstva se po
              pravilu vraćaju u roku od <strong>7 radnih dana</strong> od
              inicijacije; tačan rok zavisi od banke izdavaoca kartice.
            </li>
            <li>
              Plaćanje PayPal-om → povraćaj direktno na PayPal nalog. PayPal
              vraća sredstva najčešće odmah, ali do prikazivanja na izvodu
              može proći do 5 radnih dana.
            </li>
            <li>
              Uplata na račun → vraćamo na isti račun sa kojeg je uplata
              stigla. Klijent dostavlja IBAN/broj računa u email odgovoru.
            </li>
          </ul>
          <p>
            U svim slučajevima povraćaj je u visini iznosa koji ste platili —
            bez troškova obrade, osim eventualnih kursnih razlika koje
            primenjuje banka izdavalac kartice prilikom konverzije.
          </p>
        </Section>

        <Section title="3. Izjava o konverziji (strani kupci)">
          <p>
            Banca Intesa AD Beograd vrši kliring transakcija u dinarima
            (RSD). Ako vaša banka izdavalac karte vodi račun u drugoj valuti
            (EUR, USD…), naplata se vrši kroz konverziju iznosa u dinare
            prema kursu Banca Intesa AD Beograd na dan transakcije. Pri
            povraćaju, banka izdavalac primenjuje važeći kurs na dan
            povraćaja — kursne razlike između ova dva trenutka mogu uticati
            na konačnu sumu prikazanu na vašem izvodu.
          </p>
        </Section>

        <Section title="4. Kako iniciramo povraćaj">
          <p>
            Pošaljite email na{" "}
            <a
              href={`mailto:${IMPRINT.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>{" "}
            sa brojem porudžbine i razlogom za povraćaj. Naš tim potvrđuje
            uslove i pokreće procesnu instrukciju u roku od dva (2) radna
            dana.
          </p>
        </Section>
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
