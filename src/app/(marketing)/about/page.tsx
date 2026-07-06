import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PreFooterCta } from "@/components/site/pre-footer-cta";
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

const ABOUT_DESCRIPTION = `${SITE.name} is the B2C sub-brand of ${SITE.parentCompany} for architectural visualization — with transparent pricing and a fast process.`;

export const metadata: Metadata = createPublicMetadata({
  title: "About us",
  description: ABOUT_DESCRIPTION,
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/about",
            name: `About us — ${SITE.name}`,
            description: ABOUT_DESCRIPTION,
          }),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About us", path: "/about" },
          ]),
          buildOrganizationJsonLd(),
        ]}
      />
      <article className="mx-auto w-full max-w-3xl px-6 pb-20 pt-20 md:pt-28">
        <p className="section-kicker">About us</p>
        <h1 className="mt-4 text-5xl leading-[1.05] text-foreground md:text-6xl">
          Architectural visualization with a human face
        </h1>

        <div className="mt-12 space-y-6 text-lg leading-relaxed text-foreground/80">
          <p>
            <strong>{SITE.name}</strong> is a dedicated sub-brand of{" "}
            <strong>{SITE.parentCompany}</strong>, created with a clear goal: to
            make architectural visualization more accessible, easier to
            understand and more transparent for the wider B2C market.
          </p>
          <p>
            Unlike traditional studios that communicate mostly through
            portfolios and individual offers, Elegant Render builds trust on
            three key promises: <strong>a clear price</strong>,{" "}
            <strong>fast delivery</strong> and{" "}
            <strong>handcrafted work at professional quality</strong>.
          </p>
          <p>
            We were never conceived as an elitist studio reserved for a narrow
            circle of investors, but as an organized, visually appealing
            service with clear pricing — for people who want to see their
            space at its best, and more clearly, before they furnish, sell or
            renovate it.
          </p>
        </div>

        <div className="mt-16 rounded-xl border border-border/60 bg-secondary/30 p-8">
          <h2 className="text-2xl text-foreground">
            Part of the {SITE.parentCompany} system
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/75">
            {SITE.parentCompany} is the umbrella business entity and the
            professional foundation, with experience in 3D visualization and
            digital architectural content. Elegant Render is the
            market-facing, more accessible and more direct channel for end
            clients — every project is produced by the same team, to the same
            quality standards.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-border/60 bg-secondary/30 p-8">
          <h2 className="text-2xl text-foreground">Certificates and standards</h2>
          <div className="mt-5 grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
            <p className="text-base leading-relaxed text-foreground/75">
              Our process is built on three international ISO standards,
              certified by <strong>{CERTIFIER.name}</strong> —{" "}
              {ISO_CERTIFICATIONS.map((cert, idx) => (
                <span key={cert.id}>
                  <strong>{cert.code}</strong> ({cert.domain.toLowerCase()})
                  {idx < ISO_CERTIFICATIONS.length - 1
                    ? idx === ISO_CERTIFICATIONS.length - 2
                      ? " and "
                      : ", "
                    : ""}
                </span>
              ))}
              . More about each standard and about {CERTIFIER.name}:{" "}
              <Link
                href="/legal/certificates"
                className="text-foreground underline-offset-4 hover:underline"
              >
                View certificates →
              </Link>
            </p>
            <Link
              href="/legal/certificates"
              aria-label={`${CERTIFIER.name} certificate — view details`}
              className="self-center justify-self-center transition-opacity duration-200 hover:opacity-90 md:self-start md:justify-self-end"
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
