import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE, formatAddress } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Uslovi korišćenja",
  description: `Uslovi korišćenja sajta i usluga ${SITE.name} — predmet ugovora, cene, isporuka, povlačenje, odgovornost.`,
  path: "/pravno/uslovi",
});

const LAST_UPDATED = "2026-05-27";

export default function UsloviPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Pravno</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Uslovi korišćenja
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
          U slučaju neslaganja sa praksom, javite nam se na{" "}
          <a
            href={`mailto:${IMPRINT.email}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            {IMPRINT.email}
          </a>
          .
        </div>

        <Section title="1. Pružalac usluga">
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
            Brand pod kojim se usluge isporučuju je <strong>{SITE.name}</strong>.
            U daljem tekstu „Pružalac“ ili „mi“, a pojedinačni korisnik se
            označava kao „Korisnik“ ili „vi“.
          </p>
        </Section>

        <Section title="2. Predmet ugovora">
          <p>
            Pružalac kreira po porudžbini sledeće usluge: 2D i 3D arhitektonske
            renderije (statične i 360°), animacije, virtuelno opremanje i
            vizuelne adaptacije postojećih fotografija, planove prostora i AI
            obrade slika. Detaljan opis usluga, obim koji ulazi u baznu cenu i
            mogući dodaci dostupni su u cenovniku na stranici{" "}
            <Link
              href="/cene"
              className="text-foreground underline-offset-4 hover:underline"
            >
              /cene
            </Link>
            .
          </p>
        </Section>

        <Section title="3. Zaključenje ugovora">
          <p>
            Ugovor između vas i Pružaoca se zaključuje u trenutku kada potvrdite
            porudžbinu kroz korpu na sajtu i izvršite uplatu (ili dobijete
            potvrdu prihvatanja porudžbine ako se plaćanje vrši po isporuci).
            Pre potvrde, imate pravo da uvidite konačnu cenu, opis usluga i ove
            uslove. Potvrdom porudžbine izjavljujete da ste se sa uslovima
            saglasili.
          </p>
        </Section>

        <Section title="4. Cene i način plaćanja">
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
              <strong>Posetioci iz drugih zemalja:</strong> u evrima (EUR), bez
              PDV-a.
            </li>
          </ul>
          <p>
            Cene su konačne za izabrani opseg posla. Dodatni rad, izmene
            obima ili nove kategorije obračunavaju se po važećem cenovniku
            ispod sekcije „Prilagodi“ za svaku stavku.
          </p>
          <p>
            Plaćanje se vrši elektronski (kartice, instant transfer) ili
            uplatnicom na poslovni račun, prema instrukcijama u checkout-u i na
            izdatoj fakturi. Račun (PDV ili otpremni) izdaje se elektronski na
            vašu e-poštu.
          </p>
        </Section>

        <Section title="5. Materijali koje obezbeđujete">
          <p>
            Za izradu usluge potrebno je da dostavite minimalni ulaz koji je
            opisan uz svaku uslugu (osnove, fotografije, reference, opis stila,
            dimenzije). Garantujete da imate pravo da koristite i da nam
            dostavite te materijale, kao i da njihovo korišćenje za potrebe
            ugovora ne narušava prava trećih lica.
          </p>
        </Section>

        <Section title="6. Isporuka">
          <p>
            Rok isporuke se definiše prilikom potvrde porudžbine i zavisi od
            obima posla. Ako se rok produžuje zbog nedostatka materijala ili
            drugih okolnosti na vašoj strani, javljamo vam blagovremeno.
            Isporuka se vrši elektronski — preuzimanjem datoteka iz portala
            (Vaše porudžbine).
          </p>
        </Section>

        <Section title="7. Revizije">
          <p>
            U svaku uslugu uračunate su <strong>tri runde revizija</strong> bez
            dodatne naknade. Revizije se odnose na materijal koji je već
            isporučen i na ulaz koji ste dostavili u trenutku porudžbine.
            Promena obima posla, dodavanje novih kadrova, prostorija ili
            izlaza obračunava se po važećem cenovniku.
          </p>
        </Section>

        <Section title="8. Pravo na odustanak (digitalne usluge)">
          <p>
            Po članu 28. Zakona o zaštiti potrošača Republike Srbije i članu
            16(m) Direktive (EU) 2011/83 o pravima potrošača, potrošač u načelu
            ima pravo da u roku od 14 dana od zaključenja ugovora odustane bez
            obrazloženja.
          </p>
          <p>
            Pošto su naše usluge <strong>digitalna kreativna izrada koja se
            započinje odmah po potvrdi i plaćanju</strong>, prilikom checkout-a
            ćete biti pozvani da izričito potvrdite saglasnost sa početkom
            izrade pre isteka 14-dnevnog roka i da prihvatite da time gubite
            pravo na odustanak. Bez te potvrde, izrada se neće započeti.
          </p>
          <p>
            Ako se izrada još uvek nije započela, pravo na odustanak ostaje na
            snazi i možete ga iskoristiti slanjem obaveštenja na{" "}
            <a
              href={`mailto:${IMPRINT.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>
            . U tom slučaju vraćamo vam uplaćeni iznos u celosti, bez odlaganja
            i najkasnije u roku od 14 dana.
          </p>
        </Section>

        <Section title="9. Reklamacije">
          <p>
            Reklamaciju u vezi sa kvalitetom ili obimom isporučene usluge možete
            uputiti na{" "}
            <a
              href={`mailto:${IMPRINT.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>{" "}
            u roku od 8 dana od prijema isporuke. Odgovor sa predlogom rešenja
            (dorada, ispravka, popust ili povraćaj) šaljemo bez odlaganja, a
            najkasnije u roku od 8 dana od prijema reklamacije.
          </p>
        </Section>

        <Section title="10. Intelektualna svojina">
          <p>
            Isporukom finalnih datoteka (renderi, animacije, planovi) prenosimo
            na vas pravo nekomercijalne i komercijalne upotrebe za potrebe
            projekta zbog kog ste poručili — uključujući marketing, oglase i
            prodaju nekretnine. <strong>Izvorni 3D model i radne datoteke</strong>{" "}
            ostaju u našem vlasništvu i ne prenose se uz baznu cenu. Ako vam
            izvorni materijal treba, dogovaramo posebnu naknadu.
          </p>
          <p>
            Materijali koje vi dostavljate ostaju u vašem vlasništvu. Vi nam
            dajete pravo da ih koristimo isključivo za izvršenje porudžbine.
            Pre korišćenja vaših materijala u našem portfoliju ili na društvenim
            mrežama tražimo izričitu saglasnost.
          </p>
        </Section>

        <Section title="11. Odgovornost">
          <p>
            Pružalac odgovara za štetu koja nastane usled grube nepažnje ili
            namernog postupanja, u skladu sa propisima Republike Srbije.
            Pružalac ne odgovara za posrednu štetu, izgubljenu dobit, niti za
            odluke koje donesete na osnovu vizuelizacija (renderi su umetnička
            interpretacija dostavljenih ulaza, ne tehnički projekat).
          </p>
        </Section>

        <Section title="12. Privatnost i zaštita podataka">
          <p>
            Detaljan opis kako obrađujemo lične podatke nalazi se u{" "}
            <Link
              href="/pravno/privatnost"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Politici privatnosti
            </Link>
            , a o kolačićima i analitici u{" "}
            <Link
              href="/pravno/kolacici"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Politici kolačića
            </Link>
            .
          </p>
        </Section>

        <Section title="13. Izmene uslova">
          <p>
            Ove uslove povremeno ažuriramo. Datum poslednjeg ažuriranja naveden
            je na vrhu dokumenta. Suštinske izmene primenjuju se na nove
            porudžbine; postojeće porudžbine zaključene pre objavljivanja
            izmena nastavljaju po prvobitnim uslovima.
          </p>
        </Section>

        <Section title="14. Nadležnost i merodavno pravo">
          <p>
            Na ugovor i ove uslove primenjuje se pravo Republike Srbije. Za
            sporove je nadležan stvarno nadležni sud prema sedištu Pružaoca,
            uz primenu obavezujućih pravila o zaštiti potrošača iz vaše zemlje
            prebivališta ako ste rezident druge zemlje EU.
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
