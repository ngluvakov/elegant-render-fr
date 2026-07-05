import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Dostava digitalnih isporuka",
  description: `Kako i kada se isporučuju arhitektonske renderije, animacije i AI obrade — ${SITE.name}.`,
  path: "/legal/delivery",
});

const LAST_UPDATED = "2026-05-29";

export default function DostavaPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Pravno</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Dostava
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Poslednje ažuriranje:{" "}
          {new Date(LAST_UPDATED).toLocaleDateString("sr-Latn-RS", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>

        <Section title="1. Priroda isporuke">
          <p>
            {SITE.name} isporučuje isključivo <strong>digitalne sadržaje</strong>{" "}
            (statične i 360° renderije, animacije, AI obrade slika, virtuelne
            ture). Nema fizičke dostave robe — sve datoteke se preuzimaju iz
            portala u kojem pratite vašu porudžbinu.
          </p>
        </Section>

        <Section title="2. Rokovi">
          <p>
            Standardni rokovi izrade i isporuke su definisani u opisu svake
            usluge u našem{" "}
            <Link
              href="/pricing"
              className="text-foreground underline-offset-4 hover:underline"
            >
              cenovniku
            </Link>
            . Za većinu projekata izrada počinje prvog radnog dana nakon
            kompletirane uplate i potvrđene specifikacije.
          </p>
          <p>
            Ako rok ne može biti ispoštovan zbog dodatnih informacija od vas
            (npr. dopuna materijala) ili više sile, obavestićemo vas pisanim
            putem sa novim, realističnim rokom.
          </p>
        </Section>

        <Section title="3. Format i način preuzimanja">
          <p>
            Svi gotovi materijali biće dostupni u portalu na linku{" "}
            <Link
              href="/portal"
              className="text-foreground underline-offset-4 hover:underline"
            >
              portal
            </Link>{" "}
            pod brojem vaše porudžbine. Email obaveštenje šaljemo na adresu
            navedenu u procesu plaćanja kada nova verzija bude spremna.
          </p>
          <p>
            Standardni formati su .jpg / .png u rezoluciji do 4K za statične
            renderije; .mp4 ili .mov za animacije; .obj/.fbx model po dogovoru.
            Posebni zahtevi za format mogu se naznačiti u napomenama
            porudžbine.
          </p>
        </Section>

        <Section title="4. Ograničenja">
          <p>
            Dostavljamo svuda u svetu — isporuka je digitalna i nije vezana za
            geografsku oblast. Cene i naplata su uvek prikazane u dinarima
            (RSD); za dodatnu napomenu o karticama vezanim za drugu valutu
            pogledajte{" "}
            <Link
              href="/legal/povracaj-sredstava"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Izjavu o konverziji
            </Link>
            .
          </p>
        </Section>

        <Section title="5. Kontakt">
          <p>
            Pitanja u vezi sa isporukom šaljite na{" "}
            <a
              href={`mailto:${IMPRINT.email}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>
            .
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
