import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PreFooterCta } from "@/components/site/pre-footer-cta";
import { SectionKicker } from "@/components/brand/section-kicker";
import { JsonLd } from "@/components/seo/json-ld";
import {
  CERTIFIER,
  ISO_CERTIFICATIONS,
  SITE,
  buildOrganizationJsonLd,
} from "@/lib/content/site";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  createPublicMetadata,
} from "@/lib/seo";

const O_NAMA_DESCRIPTION = `${SITE.name} je B2C podbrend kompanije ${SITE.parentCompany} za arhitektonsku vizuelizaciju — sa transparentnim cenama i brzim procesom.`;

export const metadata: Metadata = createPublicMetadata({
  title: "O nama",
  description: O_NAMA_DESCRIPTION,
  path: "/o-nama",
});

export default function ONamaPage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/o-nama",
            name: `O nama — ${SITE.name}`,
            description: O_NAMA_DESCRIPTION,
          }),
          buildBreadcrumbJsonLd([
            { name: "Početna", path: "/" },
            { name: "O nama", path: "/o-nama" },
          ]),
          buildOrganizationJsonLd(),
        ]}
      />
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

        <div className="mt-6 rounded-xl border border-border/60 bg-secondary/30 p-8">
          <h2 className="text-2xl text-foreground">Sertifikati i standardi</h2>
          <div className="mt-5 grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
            <p className="text-base leading-relaxed text-foreground/75">
              Naš proces počiva na tri međunarodna ISO standarda, sertifikovana
              od strane <strong>{CERTIFIER.name}</strong> —{" "}
              {ISO_CERTIFICATIONS.map((cert, idx) => (
                <span key={cert.id}>
                  <strong>{cert.code}</strong> ({cert.domain.toLowerCase()})
                  {idx < ISO_CERTIFICATIONS.length - 1
                    ? idx === ISO_CERTIFICATIONS.length - 2
                      ? " i "
                      : ", "
                    : ""}
                </span>
              ))}
              . Detaljnije o svakom standardu i o {CERTIFIER.name}-u:{" "}
              <Link
                href="/pravno/sertifikati"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Pogledajte sertifikate →
              </Link>
            </p>
            <Link
              href="/pravno/sertifikati"
              aria-label={`${CERTIFIER.name} sertifikat — pogledaj detalje`}
              className="self-center justify-self-center transition hover:opacity-90 md:self-start md:justify-self-end"
            >
              <Image
                src={CERTIFIER.badgeAsset.src}
                alt={CERTIFIER.badgeAsset.alt}
                width={CERTIFIER.badgeAsset.width}
                height={CERTIFIER.badgeAsset.height}
                sizes="(max-width: 768px) 60vw, 200px"
                className="h-auto w-[200px] max-w-full"
              />
            </Link>
          </div>
        </div>
      </article>
      <PreFooterCta />
    </>
  );
}
