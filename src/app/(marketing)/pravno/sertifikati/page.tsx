import type { Metadata } from "next";
import Image from "next/image";
import { FinalCta } from "@/components/marketing/final-cta";
import { SectionKicker } from "@/components/brand/section-kicker";
import { CERTIFIER, ISO_CERTIFICATIONS, SITE } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "Sertifikati i standardi",
  description: `${SITE.name} posluje po sertifikovanim ISO standardima 9001:2015, 27001 i 50001 — sertifikovano od strane ${CERTIFIER.name}.`,
  openGraph: {
    title: "Sertifikati i standardi — Elegant Render",
    description: `${SITE.name} posluje po sertifikovanim ISO standardima 9001:2015, 27001 i 50001 — sertifikovano od strane ${CERTIFIER.name}.`,
    url: "/pravno/sertifikati",
  },
};

export default function SertifikatiPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-20 pt-20 md:pt-28">
        <SectionKicker>Pravno</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Sertifikati i standardi
        </h1>

        <div className="mt-10 flex justify-center rounded-2xl border border-border/60 bg-card/60 p-6 md:p-10">
          <Image
            src={CERTIFIER.badgeAsset.src}
            alt={CERTIFIER.badgeAsset.alt}
            width={CERTIFIER.badgeAsset.width}
            height={CERTIFIER.badgeAsset.height}
            sizes="(max-width: 768px) 90vw, 520px"
            className="h-auto w-full max-w-[520px]"
            priority
          />
        </div>

        <div className="mt-10 space-y-6 text-base leading-relaxed text-foreground/75">
          <p>
            {SITE.name} posluje po tri međunarodna ISO standarda, sertifikovana od
            strane <strong>{CERTIFIER.name}</strong>. Standardi pokrivaju kvalitet
            isporuke, bezbednost vaših podataka i energetsku efikasnost
            produkcije — tri ose poverenja koje su nam važne i koje znače
            konkretne procedure, ne samo izjave.
          </p>
          <p className="text-sm text-foreground/65">
            Sertifikat pokriva sva tri standarda pod istim ID-em (
            <strong className="text-foreground/85">9000025319</strong>) i izdat je
            od strane {CERTIFIER.name}. Originalni dokument možete preuzeti{" "}
            <a
              href={CERTIFIER.badgeAsset.pdfSrc}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              ovde (PDF)
            </a>
            .
          </p>
        </div>

        <div className="mt-12 space-y-6">
          {ISO_CERTIFICATIONS.map((cert) => (
            <div
              key={cert.id}
              className="rounded-xl border border-border/60 bg-secondary/30 p-8"
            >
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                {cert.domain}
              </p>
              <h2 className="mt-3 text-2xl text-foreground md:text-3xl">
                {cert.code}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-foreground/75">
                {cert.description}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground/60">
                <span>
                  Sertifikat izdao:{" "}
                  <strong className="text-foreground/80">{CERTIFIER.name}</strong>
                </span>
                {cert.certNumber && (
                  <span className="text-foreground/55">
                    Broj sertifikata: {cert.certNumber}
                  </span>
                )}
                {cert.verifyUrl && (
                  <a
                    href={cert.verifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    Verifikuj sertifikat →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-xl border border-border/60 bg-secondary/30 p-8">
          <h2 className="text-2xl text-foreground">O sertifikacionom telu</h2>
          <p className="mt-2 text-sm text-foreground/55">{CERTIFIER.fullName}</p>
          <p className="mt-4 text-base leading-relaxed text-foreground/75">
            {CERTIFIER.description}
          </p>
        </div>
      </article>
      <FinalCta />
    </>
  );
}
