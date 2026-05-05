import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import {
  CERTIFIER,
  IMPRINT,
  SITE,
  formatAddress,
} from "@/lib/content/site";

export const metadata: Metadata = {
  title: "Politika privatnosti",
  description: `Politika privatnosti ${SITE.name} — kako obrađujemo lične podatke korisnika, koja prava imate i kome se obraćate.`,
  openGraph: {
    title: "Politika privatnosti — Elegant Render",
    description: `Politika privatnosti ${SITE.name}.`,
    url: "/pravno/privatnost",
  },
};

const LAST_UPDATED = "2026-05-06";

export default function PrivatnostPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Pravno</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Politika privatnosti
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
          je radna verzija pripremljena na osnovu trenutnog stanja sistema i
          relevantnih propisa Republike Srbije i Evropske unije. Pre javne
          upotrebe biće predat na pravni pregled. U slučaju neslaganja između
          opisa i stvarne prakse, javite nam se na{" "}
          <a
            href={`mailto:${IMPRINT.privacyEmail}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            {IMPRINT.privacyEmail}
          </a>
          .
        </div>

        <Section title="1. Ko je rukovalac podataka">
          <p>
            Rukovalac vaših ličnih podataka u smislu Zakona o zaštiti podataka
            o ličnosti („ZZPL“, Sl. glasnik RS br. 87/2018) i Opšte uredbe o
            zaštiti podataka EU 2016/679 („GDPR“) je:
          </p>
          <p className="rounded-md border border-border/60 bg-secondary/30 p-4 font-mono text-[0.86rem] leading-relaxed">
            {IMPRINT.legalName}
            <br />
            {formatAddress()}
            <br />
            MB: {IMPRINT.registryNumber} · PIB: {IMPRINT.taxId}
            <br />
            E-pošta:{" "}
            <a
              href={`mailto:${IMPRINT.privacyEmail}`}
              className="font-sans text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.privacyEmail}
            </a>
          </p>
          <p>
            Brand pod kojim se usluge isporučuju je <strong>{SITE.name}</strong>.
          </p>
        </Section>

        <Section title="2. Podaci koje prikupljamo">
          <p>U toku korišćenja sajta i usluga, obrađujemo sledeće kategorije:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Pri registraciji naloga:</strong> ime, e-pošta, lozinka
              (čuvana isključivo kao bcrypt heš), opciono telefon. Kod prijave
              putem Google naloga preuzimamo ime, e-poštu i avatar koje Google
              prosleđuje uz vašu izričitu saglasnost.
            </li>
            <li>
              <strong>Pri formiranju ponude i porudžbine:</strong> stavke
              porudžbine, konfiguracija svake usluge, kontakt podaci za
              isporuku, instrukcije po prostoriji ili sceni, fajlovi koje
              uploadujete (osnove, fotografije, reference).
            </li>
            <li>
              <strong>Pri podnošenju upita preko forme „Brzi upit“:</strong>{" "}
              ime, e-pošta, telefon (opciono), opis projekta, fajlovi.
            </li>
            <li>
              <strong>Pri korišćenju AI Studija:</strong> ulazne slike i
              tekstualni prompts koje šaljete, izlazne slike koje generišemo,
              metapodaci o transakciji (broj kredita, vreme).
            </li>
            <li>
              <strong>Pri komunikaciji preko chat asistenta:</strong> sadržaj
              poruka i metapodaci sesije.
            </li>
            <li>
              <strong>Tehnički podaci:</strong> IP adresa, podaci o uređaju i
              pretraživaču, datumi i vreme zahteva, log-ovi grešaka — koriste
              se za bezbednost, ispravljanje grešaka i sprečavanje zloupotrebe.
            </li>
            <li>
              <strong>Kolačići i slične tehnologije:</strong> opisani u zasebnom
              dokumentu —{" "}
              <Link
                href="/pravno/kolacici"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Politika kolačića
              </Link>
              .
            </li>
          </ul>
        </Section>

        <Section title="3. Pravni osnov za obradu">
          <p>
            U skladu sa članom 12. ZZPL i članom 6. GDPR, obrada se vrši na
            osnovu jednog od sledećih pravnih osnova:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Izvršenje ugovora</strong> (čl. 12. st. 1. tač. 2. ZZPL /
              čl. 6 ⒝ GDPR) — kada vam isporučujemo poručenu uslugu, vodimo
              vaš nalog ili obrađujemo plaćanje.
            </li>
            <li>
              <strong>Saglasnost</strong> (čl. 12. st. 1. tač. 1. ZZPL / čl. 6 ⒜
              GDPR) — za neobavezne kategorije: analitiku, snimanje sesija,
              marketing. Saglasnost možete povući u svakom trenutku preko linka{" "}
              „Podešavanja kolačića“ u podnožju sajta.
            </li>
            <li>
              <strong>Legitimni interes</strong> (čl. 12. st. 1. tač. 6. ZZPL /
              čl. 6 ⒡ GDPR) — bezbednost sistema, sprečavanje zloupotrebe,
              osnovno izveštavanje o greškama bez ličnih identifikatora,
              vođenje internih evidencija.
            </li>
            <li>
              <strong>Zakonska obaveza</strong> (čl. 12. st. 1. tač. 3. ZZPL /
              čl. 6 ⒞ GDPR) — fakturisanje, knjigovodstvo, izveštavanje
              poreskim organima, postupanje po zahtevima nadležnih organa.
            </li>
          </ul>
        </Section>

        <Section title="4. Obrađivači i prenos podataka">
          <p>
            U skladu sa članom 45. ZZPL i članom 28. GDPR, deo obrade poveravamo
            obrađivačima. Sa svakim imamo zaključen ugovor o obradi (DPA) koji
            uređuje svrhu, obim i bezbednosne mere. Vaši podaci se ne prodaju
            trećim licima ni u jednoj situaciji.
          </p>

          <div className="-mx-2 mt-2 overflow-x-auto sm:mx-0">
            <table className="min-w-full text-sm">
              <thead className="text-left text-[0.78rem] uppercase tracking-[0.16em] text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="px-2 py-3">Obrađivač</th>
                  <th className="px-2 py-3">Lokacija</th>
                  <th className="px-2 py-3">Svrha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground/80">
                <ProcessorRow
                  name="Vercel Inc."
                  location="SAD / EU"
                  purpose="Hosting aplikacije i isporuka stranica."
                />
                <ProcessorRow
                  name="Supabase Inc."
                  location="EU (Frankfurt)"
                  purpose="Hosting baze podataka i datotečnog skladišta."
                />
                <ProcessorRow
                  name="OpenAI"
                  location="SAD"
                  purpose="Generisanje slika i obrada AI zadataka u AI Studiju."
                />
                <ProcessorRow
                  name="Sentry (Functional Software, Inc.)"
                  location="SAD / EU"
                  purpose="Izveštavanje o greškama i performansama (samo uz saglasnost)."
                />
                <ProcessorRow
                  name="PostHog Inc."
                  location="SAD / EU"
                  purpose="Anonimna analitika korišćenja sajta (samo uz saglasnost)."
                />
                <ProcessorRow
                  name="Bitrix24 (Bitrix Inc.)"
                  location="EU"
                  purpose="CRM sistem za vođenje porudžbina i kontakata."
                />
                <ProcessorRow
                  name="Upstash"
                  location="EU"
                  purpose="Privremeni keš i ograničenje brzine zahteva (rate limiting)."
                />
                <ProcessorRow
                  name="Google (preko Auth.js)"
                  location="SAD / EU"
                  purpose="Autentifikacija putem Google naloga, ako se koristi."
                />
              </tbody>
            </table>
          </div>

          <p>
            Za prenos podataka u zemlje van Evropskog ekonomskog prostora
            koristimo standardne ugovorne klauzule (Standard Contractual
            Clauses) Evropske komisije ili druge zakonom predviđene
            instrumente.
          </p>
        </Section>

        <Section title="5. Period čuvanja">
          <p>
            Podatke čuvamo onoliko koliko je neophodno za svrhu obrade i u
            skladu sa zakonskim rokovima:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Korisnički nalog:</strong> dok je nalog aktivan, najduže
              5 godina nakon poslednje aktivnosti.
            </li>
            <li>
              <strong>Porudžbine, fakture, knjigovodstveni dokumenti:</strong>{" "}
              10 godina (čl. 16. Zakona o računovodstvu).
            </li>
            <li>
              <strong>Nezavršene ponude (quote):</strong> 30 dana, automatski
              brisanje.
            </li>
            <li>
              <strong>AI fajlovi (ulazi i izlazi):</strong> 30 dana od kreiranja.
            </li>
            <li>
              <strong>AI krediti:</strong> 12 meseci od dopune.
            </li>
            <li>
              <strong>Log-ovi grešaka i analitike:</strong> do 90 dana po
              standardnim postavkama obrađivača.
            </li>
            <li>
              <strong>Upiti preko kontakt formi:</strong> 24 meseca od poslednje
              komunikacije.
            </li>
          </ul>
        </Section>

        <Section title="6. Vaša prava">
          <p>
            U skladu sa članovima 26–37. ZZPL i članovima 15–22. GDPR, imate
            pravo na:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Pristup</strong> — kopiju ličnih podataka koje obrađujemo.
            </li>
            <li>
              <strong>Ispravku</strong> — netačne ili nepotpune podatke
              ispravljamo bez odlaganja.
            </li>
            <li>
              <strong>Brisanje („pravo na zaborav“)</strong> — kada osnov za
              obradu prestane.
            </li>
            <li>
              <strong>Ograničenje obrade</strong> — privremeno zaustavljanje
              obrade pod određenim uslovima.
            </li>
            <li>
              <strong>Prenosivost</strong> — strukturirani izvoz vaših podataka.
            </li>
            <li>
              <strong>Prigovor</strong> — protiv obrade na osnovu legitimnog
              interesa, kao i protiv direktnog marketinga.
            </li>
            <li>
              <strong>Povlačenje saglasnosti</strong> — u svakom trenutku, bez
              uticaja na zakonitost prethodne obrade.
            </li>
          </ul>
          <p>
            Zahtev podnosite na{" "}
            <a
              href={`mailto:${IMPRINT.privacyEmail}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.privacyEmail}
            </a>
            . Odgovor vam šaljemo bez nepotrebnog odlaganja, najkasnije u roku
            od 30 dana. Imate pravo da uložite žalbu Povereniku za informacije
            od javnog značaja i zaštitu podataka o ličnosti (
            <a
              href="https://www.poverenik.rs"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              poverenik.rs
            </a>
            ), odnosno nadzornom organu u zemlji svog prebivališta ako ste
            rezident druge zemlje EU.
          </p>
        </Section>

        <Section title="7. Predstavnik u Evropskoj uniji (čl. 27. GDPR)">
          <p>
            {IMPRINT.shortName} je registrovano u Republici Srbiji i sajt nudi
            usluge i klijentima iz EU. <strong>Postupak imenovanja
            predstavnika u Evropskoj uniji je u toku.</strong> Do imenovanja,
            korisnici iz EU za pitanja zaštite podataka mogu da se obrate
            direktno na{" "}
            <a
              href={`mailto:${IMPRINT.privacyEmail}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.privacyEmail}
            </a>
            , odnosno nadzornom organu u svojoj zemlji.
          </p>
        </Section>

        <Section title="8. Bezbednost podataka">
          <p>
            Sistem upravljanja informacionom bezbednošću sertifikovan je po
            standardu <strong>ISO/IEC 27001:2022</strong> od strane{" "}
            <strong>{CERTIFIER.name}</strong> (broj sertifikata 9000025319). To
            znači konkretne procedure: kontrolisani pristup, šifrovanje u
            tranzitu (TLS), bcrypt heširanje lozinki, definisana retencija,
            audit-i i procesi reagovanja na incidente. Detaljnije:{" "}
            <Link
              href="/pravno/sertifikati"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Sertifikati i standardi
            </Link>
            .
          </p>
        </Section>

        <Section title="9. Maloletnici">
          <p>
            Sajt nije namenjen licima mlađim od 16 godina. Ako saznamo da smo
            bez saglasnosti roditelja prikupili podatke maloletnika mlađeg od
            16 godina, takve podatke odmah brišemo.
          </p>
        </Section>

        <Section title="10. Izmene politike">
          <p>
            Ovu politiku možemo povremeno menjati. Datum poslednjeg ažuriranja
            naveden je na vrhu dokumenta. O suštinskim izmenama obaveštavamo
            registrovane korisnike e-poštom.
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

function ProcessorRow({
  name,
  location,
  purpose,
}: {
  name: string;
  location: string;
  purpose: string;
}) {
  return (
    <tr>
      <td className="px-2 py-3 align-top font-medium text-foreground">{name}</td>
      <td className="px-2 py-3 align-top text-muted-foreground">{location}</td>
      <td className="px-2 py-3 align-top">{purpose}</td>
    </tr>
  );
}
