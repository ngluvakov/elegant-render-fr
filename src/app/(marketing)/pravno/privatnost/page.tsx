import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { CERTIFIER, SITE } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "Politika privatnosti",
  description: `Politika privatnosti ${SITE.name} — kako obrađujemo vaše podatke i u koje svrhe.`,
  openGraph: {
    title: "Politika privatnosti — Elegant Render",
    description: `Politika privatnosti ${SITE.name} — kako obrađujemo vaše podatke i u koje svrhe.`,
    url: "/pravno/privatnost",
  },
};

export default function PrivatnostPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
      <SectionKicker>Pravno</SectionKicker>
      <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
        Politika privatnosti
      </h1>
      <p className="mt-6 text-base text-foreground/60">
        Poslednje ažuriranje: u pripremi
      </p>
      <div className="mt-12 space-y-6 text-base leading-relaxed text-foreground/75">
        <p>
          {SITE.name} (deo {SITE.parentCompany}) poštuje privatnost korisnika i
          obavezuje se da će sa svim podacima postupati u skladu sa važećim
          propisima Republike Srbije i Opštom uredbom EU o zaštiti podataka
          (GDPR).
        </p>
        <p>
          Sistem upravljanja informacionom bezbednošću sertifikovan je po
          standardu <strong>ISO/IEC 27001:2022</strong> od strane{" "}
          <strong>{CERTIFIER.name}</strong>, što našu GDPR usklađenost
          potkrepljuje konkretnim procedurama: kontrolisanim pristupom,
          šifrovanjem u tranzitu, definisanom retencijom i procesima za
          reagovanje na incidente. Detaljnije o našim sertifikatima:{" "}
          <Link
            href="/pravno/sertifikati"
            className="text-foreground underline-offset-4 hover:underline"
          >
            /pravno/sertifikati
          </Link>
          .
        </p>
        <p className="italic text-foreground/60">
          Kompletna politika privatnosti biće objavljena pre javnog lansiranja
          sajta, nakon pregleda od strane pravnog tima. Za bilo kakva pitanja u
          vezi sa vašim podacima, pišite nam na{" "}
          <a
            href={`mailto:${SITE.email}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            {SITE.email}
          </a>
          .
        </p>
      </div>
    </article>
  );
}
