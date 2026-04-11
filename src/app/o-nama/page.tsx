import type { Metadata } from "next";
import { FinalCta } from "@/components/marketing/final-cta";
import { SectionKicker } from "@/components/brand/section-kicker";
import { SITE } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "O nama",
  description: `${SITE.name} je B2C podbrend kompanije ${SITE.parentCompany} za arhitektonsku vizuelizaciju — sa transparentnim cenama i brzim procesom.`,
};

export default function ONamaPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-20 pt-20 md:pt-28">
        <SectionKicker>O nama</SectionKicker>
        <h1 className="mt-4 text-5xl leading-[1.05] text-foreground md:text-6xl">
          Arhitektonska vizuelizacija sa ljudskim licem
        </h1>

        <div className="mt-12 space-y-6 text-lg leading-relaxed text-foreground/80">
          <p>
            <strong>{SITE.name}</strong> je poseban podbrend kompanije{" "}
            <strong>{SITE.parentCompany}</strong>, razvijen sa jasnim ciljem da
            arhitektonsku vizuelizaciju učini pristupačnijom, razumljivijom i
            transparentnijom za šire B2C tržište.
          </p>
          <p>
            Za razliku od klasičnih studija koji komuniciraju pretežno kroz
            portfolio i individualne ponude, Elegant Render gradi poverenje kroz
            spoj tri ključna obećanja: <strong>jasna cena</strong>,{" "}
            <strong>brza isporuka</strong> i{" "}
            <strong>ručna izrada sa profesionalnim kvalitetom</strong>.
          </p>
          <p>
            Nismo zamišljeni kao elitistički studio rezervisan za uzak krug
            investitora, već kao organizovan, vizuelno dopadljiv i cenovno jasan
            servis za ljude koji žele da vide svoj prostor lepše i jasnije pre
            nego što ga urede, prodaju ili renoviraju.
          </p>
        </div>

        <div className="mt-16 rounded-xl border border-border/60 bg-secondary/30 p-8">
          <h2 className="text-2xl text-foreground">
            Deo {SITE.parentCompany} sistema
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/75">
            {SITE.parentCompany} je krovni poslovni entitet i stručna osnova
            sa iskustvom u 3D vizuelizaciji i digitalnim arhitektonskim
            sadržajima. Elegant Render je tržišno prilagođen, pristupačniji i
            direktniji kanal za krajnje kupce — svi projekti se izvode u istom
            timu i po istim kvalitativnim standardima.
          </p>
        </div>
      </article>
      <FinalCta />
    </>
  );
}
