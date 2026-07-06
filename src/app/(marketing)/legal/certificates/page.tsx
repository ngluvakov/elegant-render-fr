import type { Metadata } from "next";
import Image from "next/image";
import { FinalCta } from "@/components/marketing/final-cta";
import { SectionKicker } from "@/components/brand/section-kicker";
import {
  CERTIFIER,
  ISO_CERTIFICATIONS,
  SITE,
} from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";

const CERTIFICATES_DESCRIPTION = `${SITE.name} works under ISO 9001:2015, ISO/IEC 27001:2022, and ISO 50001:2018 standards certified by ${CERTIFIER.name}.`;

const CERTIFICATE_COPY: Record<string, { domain: string; description: string }> = {
  "iso-9001": {
    domain: "Quality management",
    description:
      "ISO 9001:2015 covers quality management for service delivery. It supports a consistent workflow from receiving project files to revision rounds and final render delivery.",
  },
  "iso-27001": {
    domain: "Information security",
    description:
      "ISO/IEC 27001:2022 covers information security management. It supports controlled access, incident handling, retention procedures, and secure treatment of customer files.",
  },
  "iso-50001": {
    domain: "Energy management",
    description:
      "ISO 50001:2018 covers energy management. It supports measured, documented improvements in energy use across production and operations.",
  },
};

export const metadata: Metadata = createPublicMetadata({
  title: "Certificates and standards",
  description: CERTIFICATES_DESCRIPTION,
  path: "/legal/certificates",
});

export default function CertificatesPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-3xl px-6 pb-20 pt-20 md:pt-28">
        <SectionKicker>Legal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Certificates and standards
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
            {SITE.name} works under three international ISO standards certified
            by <strong>{CERTIFIER.name}</strong>. They cover delivery quality,
            information security, and energy management.
          </p>
          <p className="text-sm text-foreground/65">
            The combined certificate uses ID{" "}
            <strong className="text-foreground/85">9000025319</strong>. The
            original document is available{" "}
            <a
              href={CERTIFIER.badgeAsset.pdfSrc}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              as a PDF
            </a>
            .
          </p>
        </div>

        <div className="mt-12 space-y-6">
          {ISO_CERTIFICATIONS.map((cert) => {
            const copy = CERTIFICATE_COPY[cert.id];
            return (
              <div
                key={cert.id}
                className="rounded-xl border border-border/60 bg-secondary/30 p-8"
              >
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {copy.domain}
                </p>
                <h2 className="mt-3 text-2xl text-foreground md:text-3xl">
                  {cert.code}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-foreground/75">
                  {copy.description}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground/60">
                  <span>
                    Issued by:{" "}
                    <strong className="text-foreground/80">
                      {CERTIFIER.name}
                    </strong>
                  </span>
                  {cert.certNumber && (
                    <span className="text-foreground/55">
                      Certificate number: {cert.certNumber}
                    </span>
                  )}
                  {cert.verifyUrl && (
                    <a
                      href={cert.verifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-foreground underline-offset-4 hover:underline"
                    >
                      Verify certificate
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 rounded-xl border border-border/60 bg-secondary/30 p-8">
          <h2 className="text-2xl text-foreground">
            About the certification body
          </h2>
          <p className="mt-2 text-sm text-foreground/55">
            International certification and audit body
          </p>
          <p className="mt-4 text-base leading-relaxed text-foreground/75">
            {CERTIFIER.name} is an international certification body. Its
            certificates rely on independent audits and ongoing management
            systems rather than a one-time declaration.
          </p>
        </div>
      </article>
      <FinalCta />
    </>
  );
}
