import type { Metadata } from "next";
import { SITE } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "Uslovi korišćenja",
  description: `Uslovi korišćenja usluga ${SITE.name} — prava, obaveze i način saradnje.`,
};

export default function UsloviPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 md:pt-28">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
        Pravno
      </p>
      <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
        Uslovi korišćenja
      </h1>
      <p className="mt-6 text-base text-foreground/60">
        Poslednje ažuriranje: u pripremi
      </p>
      <div className="mt-12 space-y-6 text-base leading-relaxed text-foreground/75">
        <p>
          Korišćenjem sajta {SITE.url} i usluga {SITE.name} prihvatate uslove
          definisane ovim dokumentom. {SITE.name} posluje u okviru{" "}
          {SITE.parentCompany} i u skladu sa važećim propisima Republike
          Srbije.
        </p>
        <p className="italic text-foreground/60">
          Kompletni uslovi korišćenja biće objavljeni pre javnog lansiranja
          sajta, nakon pregleda od strane pravnog tima.
        </p>
      </div>
    </article>
  );
}
