import type { Metadata } from "next";
import { SectionKicker } from "@/components/brand/section-kicker";
import { SITE } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "Politika kolačića",
  description: `Kako ${SITE.name} koristi kolačiće na sajtu.`,
};

export default function KolaciciPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
      <SectionKicker>Pravno</SectionKicker>
      <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
        Politika kolačića
      </h1>
      <p className="mt-6 text-base text-foreground/60">
        Poslednje ažuriranje: u pripremi
      </p>
      <div className="mt-12 space-y-6 text-base leading-relaxed text-foreground/75">
        <p>
          {SITE.name} koristi kolačiće isključivo za tehničko funkcionisanje
          sajta i razumevanje kako posetioci koriste stranice. Ne koristimo
          kolačiće za ciljano oglašavanje bez vaše saglasnosti.
        </p>
        <p className="italic text-foreground/60">
          Detaljan opis kolačića biće objavljen pre javnog lansiranja, uz opciju
          za prihvatanje ili odbijanje pojedinih kategorija kolačića.
        </p>
      </div>
    </article>
  );
}
