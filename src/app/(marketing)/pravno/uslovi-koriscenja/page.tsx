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
  title: "Pravna dokumenta · Elegant Render",
  description:
    "Opšti uslovi korišćenja, Politika privatnosti i Politika povraćaja sredstava.",
};

const LAST_UPDATED_USLOVI = "2026-05-27";
const LAST_UPDATED_PRIVATNOST = "2026-05-20";
const LAST_UPDATED_POVRACAJ = "2026-05-29";

export default function PravnaDokumentaPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Pravno</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Pravna dokumenta
        </h1>
        <p className="mt-6 text-base leading-relaxed text-foreground/75">
          Ova stranica objedinjuje sva pravna dokumenta koja se odnose na
          korišćenje usluga Elegant Render (White Rook DOO). Primenjuju se
          od trenutka kada poručite uslugu.
        </p>

        <nav
          className="mt-8 rounded-xl border border-border/40 bg-secondary/20 p-5"
          aria-label="Sadržaj"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sadržaj
          </p>
          <ol className="space-y-2 text-sm text-foreground/80">
            <li>
              <a
                href="#uslovi"
                className="underline-offset-4 hover:underline"
              >
                Opšti uslovi korišćenja
              </a>
            </li>
            <li>
              <a
                href="#privatnost"
                className="underline-offset-4 hover:underline"
              >
                Politika privatnosti
              </a>
            </li>
            <li>
              <a
                href="#povracaj"
                className="underline-offset-4 hover:underline"
              >
                Politika povraćaja sredstava
              </a>
            </li>
          </ol>
        </nav>

        {/* ── OPŠTI USLOVI ────────────────────────────────────── */}
        <section id="uslovi" className="mt-20 scroll-mt-20">
          <h2 className="text-3xl text-foreground">Opšti uslovi korišćenja</h2>
          <p className="mt-3 text-sm text-foreground/50">
            Poslednje ažuriranje:{" "}
            {new Date(LAST_UPDATED_USLOVI).toLocaleDateString("sr-Latn-RS", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>

          <div className="mt-6 rounded-xl border border-[color:var(--color-clay-deep)]/30 bg-[color:var(--color-clay)]/8 p-5 text-sm leading-relaxed text-foreground/80">
            <strong className="text-foreground">Napomena.</strong> Ovaj dokument
            je radna verzija. Pre javne upotrebe biće predat na pravni pregled.
            U slučaju neslaganja sa praksom, javite nam se na{" "}
            <a
              href={`mailto:${IMPRINT.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>
            .
          </div>

          <LegalSection title="1. Pružalac usluga">
            <p>
              Sajt {SITE.url.replace(/^https?:\/\//, "")} i sve usluge dostupne
              na njemu pruža:
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
                href={`mailto:${IMPRINT.email}`}
                className="font-sans text-foreground underline-offset-4 hover:underline"
              >
                {IMPRINT.email}
              </a>
            </p>
            <p>
              Brand pod kojim se usluge isporučuju je{" "}
              <strong>{SITE.name}</strong>. U daljem tekstu „Pružalac" ili
              „mi", a pojedinačni korisnik se označava kao „Korisnik" ili „vi".
            </p>
          </LegalSection>

          <LegalSection title="2. Predmet ugovora">
            <p>
              Pružalac kreira po porudžbini sledeće usluge: 2D i 3D
              arhitektonske renderije (statične i 360°), animacije, virtuelno
              opremanje i vizuelne adaptacije postojećih fotografija, planove
              prostora i AI obrade slika. Detaljan opis usluga, obim koji ulazi
              u baznu cenu i mogući dodaci dostupni su u cenovniku na stranici{" "}
              <Link
                href="/cene"
                className="text-foreground underline-offset-4 hover:underline"
              >
                /cene
              </Link>
              .
            </p>
          </LegalSection>

          <LegalSection title="3. Zaključenje ugovora">
            <p>
              Ugovor između vas i Pružaoca se zaključuje u trenutku kada
              potvrdite porudžbinu kroz korpu na sajtu i izvršite uplatu (ili
              dobijete potvrdu prihvatanja porudžbine ako se plaćanje vrši po
              isporuci). Pre potvrde, imate pravo da uvidite konačnu cenu, opis
              usluga i ove uslove. Potvrdom porudžbine izjavljujete da ste se
              sa uslovima saglasili.
            </p>
          </LegalSection>

          <LegalSection title="4. Cene i način plaćanja">
            <p>Cene su izražene zavisno od zemlje posetioca:</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong>Posetioci iz Srbije:</strong> u dinarima (RSD), kao
                bruto cena sa uračunatim PDV-om po stopi od 20%. RSD iznos se
                direktno prevodi iz osnovnog EUR cenovnika po objavljenom kursu;
                PDV se ne dodaje preko tog iznosa, već se iz njega izdvaja na
                računu.
              </li>
              <li>
                <strong>Posetioci iz drugih zemalja:</strong> u evrima (EUR),
                bez PDV-a.
              </li>
            </ul>
            <p>
              Cene su konačne za izabrani opseg posla. Dodatni rad, izmene
              obima ili nove kategorije obračunavaju se po važećem cenovniku
              ispod sekcije „Prilagodi" za svaku stavku.
            </p>
            <p>
              Plaćanje se vrši elektronski (kartice, instant transfer) ili
              uplatnicom na poslovni račun, prema instrukcijama u checkout-u i
              na izdatoj fakturi. Račun (PDV ili otpremni) izdaje se elektronski
              na vašu e-poštu.
            </p>
          </LegalSection>

          <LegalSection title="5. Materijali koje obezbeđujete">
            <p>
              Za izradu usluge potrebno je da dostavite minimalni ulaz koji je
              opisan uz svaku uslugu (osnove, fotografije, reference, opis
              stila, dimenzije). Garantujete da imate pravo da koristite i da
              nam dostavite te materijale, kao i da njihovo korišćenje za
              potrebe ugovora ne narušava prava trećih lica.
            </p>
          </LegalSection>

          <LegalSection title="6. Isporuka">
            <p>
              Rok isporuke se definiše prilikom potvrde porudžbine i zavisi od
              obima posla. Ako se rok produžuje zbog nedostatka materijala ili
              drugih okolnosti na vašoj strani, javljamo vam blagovremeno.
              Isporuka se vrši elektronski — preuzimanjem datoteka iz portala
              (Vaše porudžbine).
            </p>
          </LegalSection>

          <LegalSection title="7. Revizije">
            <p>
              U svaku uslugu uračunate su{" "}
              <strong>tri runde revizija</strong> bez dodatne naknade. Revizije
              se odnose na materijal koji je već isporučen i na ulaz koji ste
              dostavili u trenutku porudžbine. Promena obima posla, dodavanje
              novih kadrova, prostorija ili izlaza obračunava se po važećem
              cenovniku.
            </p>
          </LegalSection>

          <LegalSection title="8. Pravo na odustanak (digitalne usluge)">
            <p>
              Po članu 28. Zakona o zaštiti potrošača Republike Srbije i članu
              16(m) Direktive (EU) 2011/83 o pravima potrošača, potrošač u
              načelu ima pravo da u roku od 14 dana od zaključenja ugovora
              odustane bez obrazloženja.
            </p>
            <p>
              Pošto su naše usluge{" "}
              <strong>
                digitalna kreativna izrada koja se započinje odmah po potvrdi i
                plaćanju
              </strong>
              , prilikom checkout-a ćete biti pozvani da izričito potvrdite
              saglasnost sa početkom izrade pre isteka 14-dnevnog roka i da
              prihvatite da time gubite pravo na odustanak. Bez te potvrde,
              izrada se neće započeti.
            </p>
            <p>
              Ako se izrada još uvek nije započela, pravo na odustanak ostaje
              na snazi i možete ga iskoristiti slanjem obaveštenja na{" "}
              <a
                href={`mailto:${IMPRINT.email}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                {IMPRINT.email}
              </a>
              . U tom slučaju vraćamo vam uplaćeni iznos u celosti, bez
              odlaganja i najkasnije u roku od 14 dana.
            </p>
          </LegalSection>

          <LegalSection title="9. Reklamacije">
            <p>
              Reklamaciju u vezi sa kvalitetom ili obimom isporučene usluge
              možete uputiti na{" "}
              <a
                href={`mailto:${IMPRINT.email}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                {IMPRINT.email}
              </a>{" "}
              u roku od 8 dana od prijema isporuke. Odgovor sa predlogom
              rešenja (dorada, ispravka, popust ili povraćaj) šaljemo bez
              odlaganja, a najkasnije u roku od 8 dana od prijema reklamacije.
            </p>
          </LegalSection>

          <LegalSection title="10. Intelektualna svojina">
            <p>
              Isporukom finalnih datoteka (renderi, animacije, planovi)
              prenosimo na vas pravo nekomercijalne i komercijalne upotrebe za
              potrebe projekta zbog kog ste poručili — uključujući marketing,
              oglase i prodaju nekretnine.{" "}
              <strong>Izvorni 3D model i radne datoteke</strong> ostaju u našem
              vlasništvu i ne prenose se uz baznu cenu. Ako vam izvorni
              materijal treba, dogovaramo posebnu naknadu.
            </p>
            <p>
              Materijali koje vi dostavljate ostaju u vašem vlasništvu. Vi nam
              dajete pravo da ih koristimo isključivo za izvršenje porudžbine.
              Pre korišćenja vaših materijala u našem portfoliju ili na
              društvenim mrežama tražimo izričitu saglasnost.
            </p>
          </LegalSection>

          <LegalSection title="11. Odgovornost">
            <p>
              Pružalac odgovara za štetu koja nastane usled grube nepažnje ili
              namernog postupanja, u skladu sa propisima Republike Srbije.
              Pružalac ne odgovara za posrednu štetu, izgubljenu dobit, niti za
              odluke koje donesete na osnovu vizuelizacija (renderi su umetnička
              interpretacija dostavljenih ulaza, ne tehnički projekat).
            </p>
          </LegalSection>

          <LegalSection title="12. Privatnost i zaštita podataka">
            <p>
              Detaljan opis kako obrađujemo lične podatke nalazi se u{" "}
              <a
                href="#privatnost"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Politici privatnosti
              </a>{" "}
              ispod, a o kolačićima i analitici u{" "}
              <Link
                href="/pravno/kolacici"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Politici kolačića
              </Link>
              .
            </p>
          </LegalSection>

          <LegalSection title="13. Izmene uslova">
            <p>
              Ove uslove povremeno ažuriramo. Datum poslednjeg ažuriranja
              naveden je na vrhu dokumenta. Suštinske izmene primenjuju se na
              nove porudžbine; postojeće porudžbine zaključene pre
              objavljivanja izmena nastavljaju po prvobitnim uslovima.
            </p>
          </LegalSection>

          <LegalSection title="14. Nadležnost i merodavno pravo">
            <p>
              Na ugovor i ove uslove primenjuje se pravo Republike Srbije. Za
              sporove je nadležan stvarno nadležni sud prema sedištu Pružaoca,
              uz primenu obavezujućih pravila o zaštiti potrošača iz vaše
              zemlje prebivališta ako ste rezident druge zemlje EU.
            </p>
            <p>
              Ako ste rezident EU i preferirate vansudsko rešavanje sporova,
              možete se obratiti{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline-offset-4 hover:underline"
              >
                EU ODR platformi
              </a>{" "}
              za onlajn rešavanje potrošačkih sporova.
            </p>
          </LegalSection>
        </section>

        {/* ── POLITIKA PRIVATNOSTI ─────────────────────────────── */}
        <section id="privatnost" className="mt-24 scroll-mt-20">
          <h2 className="text-3xl text-foreground">Politika privatnosti</h2>
          <p className="mt-3 text-sm text-foreground/50">
            Poslednje ažuriranje:{" "}
            {new Date(LAST_UPDATED_PRIVATNOST).toLocaleDateString(
              "sr-Latn-RS",
              { day: "2-digit", month: "2-digit", year: "numeric" },
            )}
          </p>

          <div className="mt-6 rounded-xl border border-[color:var(--color-clay-deep)]/30 bg-[color:var(--color-clay)]/8 p-5 text-sm leading-relaxed text-foreground/80">
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

          <LegalSection title="1. Ko je rukovalac podataka">
            <p>
              Rukovalac vaših ličnih podataka u smislu Zakona o zaštiti podataka
              o ličnosti („ZZPL", Sl. glasnik RS br. 87/2018) i Opšte uredbe o
              zaštiti podataka EU 2016/679 („GDPR") je:
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
              Brand pod kojim se usluge isporučuju je{" "}
              <strong>{SITE.name}</strong>.
            </p>
          </LegalSection>

          <LegalSection title="2. Podaci koje prikupljamo">
            <p>
              U toku korišćenja sajta i usluga, obrađujemo sledeće kategorije:
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong>Pri registraciji naloga:</strong> ime, e-pošta, lozinka
                (čuvana isključivo kao bcrypt heš), opciono telefon. Kod
                prijave putem Google naloga preuzimamo ime, e-poštu i avatar
                koje Google prosleđuje uz vašu izričitu saglasnost.
              </li>
              <li>
                <strong>Pri formiranju ponude i porudžbine:</strong> stavke
                porudžbine, konfiguracija svake usluge, kontakt podaci za
                isporuku, instrukcije po prostoriji ili sceni, fajlovi koje
                uploadujete (osnove, fotografije, reference).
              </li>
              <li>
                <strong>
                  Pri podnošenju upita preko forme „Brzi upit":
                </strong>{" "}
                ime, e-pošta, telefon (opciono), opis projekta, fajlovi.
              </li>
              <li>
                <strong>Pri korišćenju AI Studija:</strong> ulazne slike i
                referentne slike objekata, tekstualni prompts koje šaljete,
                izlazne slike koje generišemo, metapodaci o transakciji (broj
                kredita, vreme).
              </li>
              <li>
                <strong>Pri komunikaciji preko chat asistenta:</strong> sadržaj
                poruka i metapodaci sesije.
              </li>
              <li>
                <strong>Tehnički podaci:</strong> IP adresa, podaci o uređaju i
                pretraživaču, datumi i vreme zahteva, log-ovi grešaka —
                koriste se za bezbednost, ispravljanje grešaka, agregatno
                merenje performansi i sprečavanje zloupotrebe.
              </li>
              <li>
                <strong>Kolačići i slične tehnologije:</strong> opisani u
                zasebnom dokumentu —{" "}
                <Link
                  href="/pravno/kolacici"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  Politika kolačića
                </Link>
                .
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="3. Pravni osnov za obradu">
            <p>
              U skladu sa članom 12. ZZPL i članom 6. GDPR, obrada se vrši na
              osnovu jednog od sledećih pravnih osnova:
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong>Izvršenje ugovora</strong> (čl. 12. st. 1. tač. 2.
                ZZPL / čl. 6 ⒝ GDPR) — kada vam isporučujemo poručenu uslugu,
                vodimo vaš nalog ili obrađujemo plaćanje.
              </li>
              <li>
                <strong>Saglasnost</strong> (čl. 12. st. 1. tač. 1. ZZPL / čl.
                6 ⒜ GDPR) — za neobavezne kategorije: analitiku, snimanje
                sesija, marketing. Saglasnost možete povući u svakom trenutku
                preko linka „Podešavanja kolačića" u podnožju sajta.
              </li>
              <li>
                <strong>Legitimni interes</strong> (čl. 12. st. 1. tač. 6.
                ZZPL / čl. 6 ⒡ GDPR) — bezbednost sistema, sprečavanje
                zloupotrebe, osnovna agregatna metrika posećenosti i performansi
                bez kolačića, osnovno izveštavanje o greškama bez ličnih
                identifikatora, vođenje internih evidencija.
              </li>
              <li>
                <strong>Zakonska obaveza</strong> (čl. 12. st. 1. tač. 3. ZZPL
                / čl. 6 ⒞ GDPR) — fakturisanje, knjigovodstvo, izveštavanje
                poreskim organima, postupanje po zahtevima nadležnih organa.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="4. Obrađivači i prenos podataka">
            <p>
              U skladu sa članom 45. ZZPL i članom 28. GDPR, deo obrade
              poveravamo obrađivačima. Sa svakim imamo zaključen ugovor o
              obradi (DPA) koji uređuje svrhu, obim i bezbednosne mere. Vaši
              podaci se ne prodaju trećim licima ni u jednoj situaciji.
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
                    purpose="Hosting aplikacije, isporuka stranica i agregatna Web Analytics / Speed Insights metrika bez kolačića."
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
                    name="Google Analytics 4"
                    location="SAD / EU"
                    purpose="Agregatna web analitika, izvori saobraćaja i ponašanje po stranicama (samo uz saglasnost)."
                  />
                  <ProcessorRow
                    name="Google Tag Manager"
                    location="SAD / EU"
                    purpose="Upravljanje mernim tagovima i dataLayer događajima, aktivno samo nakon saglasnosti za analitiku."
                  />
                  <ProcessorRow
                    name="LinkedIn Insight Tag"
                    location="SAD / EU"
                    purpose="Merenje LinkedIn kampanja, konverzija i publike, aktivno samo nakon saglasnosti za marketing."
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
          </LegalSection>

          <LegalSection title="5. Period čuvanja">
            <p>
              Podatke čuvamo onoliko koliko je neophodno za svrhu obrade i u
              skladu sa zakonskim rokovima:
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong>Korisnički nalog:</strong> dok je nalog aktivan,
                najduže 5 godina nakon poslednje aktivnosti.
              </li>
              <li>
                <strong>
                  Porudžbine, fakture, knjigovodstveni dokumenti:
                </strong>{" "}
                10 godina (čl. 16. Zakona o računovodstvu).
              </li>
              <li>
                <strong>Nezavršene ponude (quote):</strong> 30 dana,
                automatski brisanje.
              </li>
              <li>
                <strong>AI fajlovi (ulazi i izlazi):</strong> 30 dana od
                kreiranja.
              </li>
              <li>
                <strong>AI krediti:</strong> 12 meseci od dopune.
              </li>
              <li>
                <strong>Log-ovi grešaka i analitike:</strong> do 90 dana po
                standardnim postavkama obrađivača.
              </li>
              <li>
                <strong>Upiti preko kontakt formi:</strong> 24 meseca od
                poslednje komunikacije.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="6. Vaša prava">
            <p>
              U skladu sa članovima 26–37. ZZPL i članovima 15–22. GDPR, imate
              pravo na:
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong>Pristup</strong> — kopiju ličnih podataka koje
                obrađujemo.
              </li>
              <li>
                <strong>Ispravku</strong> — netačne ili nepotpune podatke
                ispravljamo bez odlaganja.
              </li>
              <li>
                <strong>Brisanje („pravo na zaborav")</strong> — kada osnov za
                obradu prestane.
              </li>
              <li>
                <strong>Ograničenje obrade</strong> — privremeno zaustavljanje
                obrade pod određenim uslovima.
              </li>
              <li>
                <strong>Prenosivost</strong> — strukturirani izvoz vaših
                podataka.
              </li>
              <li>
                <strong>Prigovor</strong> — protiv obrade na osnovu legitimnog
                interesa, kao i protiv direktnog marketinga.
              </li>
              <li>
                <strong>Povlačenje saglasnosti</strong> — u svakom trenutku,
                bez uticaja na zakonitost prethodne obrade.
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
              . Odgovor vam šaljemo bez nepotrebnog odlaganja, najkasnije u
              roku od 30 dana. Imate pravo da uložite žalbu Povereniku za
              informacije od javnog značaja i zaštitu podataka o ličnosti (
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
          </LegalSection>

          <LegalSection title="7. Predstavnik u Evropskoj uniji (čl. 27. GDPR)">
            <p>
              {IMPRINT.shortName} je registrovano u Republici Srbiji i sajt
              nudi usluge i klijentima iz EU.{" "}
              <strong>
                Postupak imenovanja predstavnika u Evropskoj uniji je u toku.
              </strong>{" "}
              Do imenovanja, korisnici iz EU za pitanja zaštite podataka mogu
              da se obrate direktno na{" "}
              <a
                href={`mailto:${IMPRINT.privacyEmail}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                {IMPRINT.privacyEmail}
              </a>
              , odnosno nadzornom organu u svojoj zemlji.
            </p>
          </LegalSection>

          <LegalSection title="8. Bezbednost podataka">
            <p>
              Sistem upravljanja informacionom bezbednošću sertifikovan je po
              standardu <strong>ISO/IEC 27001:2022</strong> od strane{" "}
              <strong>{CERTIFIER.name}</strong> (broj sertifikata 9000025319).
              To znači konkretne procedure: kontrolisani pristup, šifrovanje u
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
          </LegalSection>

          <LegalSection title="9. Maloletnici">
            <p>
              Sajt nije namenjen licima mlađim od 16 godina. Ako saznamo da
              smo bez saglasnosti roditelja prikupili podatke maloletnika
              mlađeg od 16 godina, takve podatke odmah brišemo.
            </p>
          </LegalSection>

          <LegalSection title="10. Izmene politike">
            <p>
              Ovu politiku možemo povremeno menjati. Datum poslednjeg
              ažuriranja naveden je na vrhu dokumenta. O suštinskim izmenama
              obaveštavamo registrovane korisnike e-poštom.
            </p>
          </LegalSection>
        </section>

        {/* ── POLITIKA POVRAĆAJA ───────────────────────────────── */}
        <section id="povracaj" className="mt-24 scroll-mt-20">
          <h2 className="text-3xl text-foreground">
            Politika povraćaja sredstava
          </h2>
          <p className="mt-3 text-sm text-foreground/50">
            Poslednje ažuriranje:{" "}
            {new Date(LAST_UPDATED_POVRACAJ).toLocaleDateString("sr-Latn-RS", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>

          <LegalSection title="1. Kada vraćamo sredstva">
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong>Odustanak u roku od 14 dana</strong> (EU CRD čl. 9,
                ZZP čl. 27), pre nego što su radovi započeli. Pri pokretanju
                porudžbine kupac eksplicitno potvrđuje da želi da rad počne
                pre isteka 14-dnevnog roka — tim potvrdjivanjem se odustaje
                od ovog prava za pokrenute digitalne usluge.
              </li>
              <li>
                <strong>Neuspešno ili otkazano izvršenje</strong> sa naše
                strane (otkazana porudžbina pre početka rada).
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
                <strong>Neuspešna autorizacija kartice</strong> — u tom
                slučaju račun nije ni zadužen; ako se desi rezervacija
                sredstava bez naplate, banka izdavalac kartice automatski
                oslobađa rezervaciju u roku od najviše 7 radnih dana.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="2. Način povraćaja">
            <p>
              Povraćaj se vrši na{" "}
              <strong>isti instrument plaćanja</strong> kojim ste obavili
              uplatu. To znači:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>
                Plaćanje karticom (Banca Intesa Nestpay) → povraćaj se
                inicira kroz Merchant Center Banca Intesa AD Beograd.
                Sredstva se po pravilu vraćaju u roku od{" "}
                <strong>7 radnih dana</strong> od inicijacije; tačan rok
                zavisi od banke izdavaoca kartice.
              </li>
              <li>
                Plaćanje PayPal-om → povraćaj direktno na PayPal nalog.
                PayPal vraća sredstva najčešće odmah, ali do prikazivanja na
                izvodu može proći do 5 radnih dana.
              </li>
              <li>
                Uplata na račun → vraćamo na isti račun sa kojeg je uplata
                stigla. Klijent dostavlja IBAN/broj računa u email odgovoru.
              </li>
            </ul>
            <p>
              U svim slučajevima povraćaj je u visini iznosa koji ste platili
              — bez troškova obrade, osim eventualnih kursnih razlika koje
              primenjuje banka izdavalac kartice prilikom konverzije.
            </p>
          </LegalSection>

          <LegalSection title="3. Izjava o konverziji (strani kupci)">
            <p>
              Banca Intesa AD Beograd vrši kliring transakcija u dinarima
              (RSD). Ako vaša banka izdavalac karte vodi račun u drugoj
              valuti (EUR, USD…), naplata se vrši kroz konverziju iznosa u
              dinare prema kursu Banca Intesa AD Beograd na dan transakcije.
              Pri povraćaju, banka izdavalac primenjuje važeći kurs na dan
              povraćaja — kursne razlike između ova dva trenutka mogu uticati
              na konačnu sumu prikazanu na vašem izvodu.
            </p>
          </LegalSection>

          <LegalSection title="4. Kako iniciramo povraćaj">
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
          </LegalSection>
        </section>
      </article>

      <FinalCta />
    </>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h3 className="text-xl text-foreground">{title}</h3>
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
      <td className="px-2 py-3 align-top font-medium text-foreground">
        {name}
      </td>
      <td className="px-2 py-3 align-top text-muted-foreground">{location}</td>
      <td className="px-2 py-3 align-top">{purpose}</td>
    </tr>
  );
}
