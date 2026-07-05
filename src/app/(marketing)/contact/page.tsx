import type { Metadata } from "next";
import { ExternalLink, Mail } from "lucide-react";
import { SectionKicker } from "@/components/brand/section-kicker";
import { ProjectInquiryForm } from "@/components/inquiry/project-inquiry-form";
import { JsonLd } from "@/components/seo/json-ld";
import { PreFooterCta } from "@/components/site/pre-footer-cta";
import { SITE, buildOrganizationJsonLd } from "@/lib/content/site";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  createPublicMetadata,
} from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Kontakt",
  description:
    "Javite nam se. Pošaljite kratak opis projekta i vratićemo se obično istog radnog dana.",
  path: "/contact",
});

export default async function KontaktPage() {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, phone: true },
      })
    : null;

  return (
    <>
      <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 pb-24 pt-20 md:pt-28">
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/contact",
            name: "Kontakt",
            description:
              "Kontakt forma za render enterijera, eksterijera, 3D osnove, virtuelno opremanje i AI obradu fotografija nekretnina.",
          }),
          buildBreadcrumbJsonLd([
            { name: "Početna", path: "/" },
            { name: "Kontakt", path: "/contact" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: "Kontakt - Elegant Render",
            url: `${SITE.url}/contact`,
            mainEntity: {
              "@id": `${SITE.url}/#organization`,
            },
          },
          buildOrganizationJsonLd(),
        ]}
      />
      <SectionKicker>Kontakt</SectionKicker>
      <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
        Javite nam se
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
        Opišite šta vam treba — prostor, obim i rok — i vraćamo se obično istog
        radnog dana sa jasnom ponudom.
      </p>

      <div className="mt-16 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-[0_20px_55px_rgba(28,26,25,0.05)] md:p-8">
          <ProjectInquiryForm
            mode="contact"
            source={{
              source: "contact-page",
              sourcePath: "/contact",
              sourceLabel: "Kontakt forma",
            }}
            initialContact={{
              name: user?.name ?? session?.user?.name ?? undefined,
              email: user?.email ?? session?.user?.email ?? undefined,
              phone: user?.phone ?? undefined,
            }}
          />
        </div>

        <aside className="space-y-8 rounded-xl border border-border/60 bg-secondary/30 p-8">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Direktan kontakt
            </h2>
            <div className="mt-4 space-y-3">
              <a
                href={`mailto:${SITE.email}`}
                className="flex items-center gap-3 text-foreground transition-colors hover:text-accent"
              >
                <Mail className="h-4 w-4" />
                {SITE.email}
              </a>
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-foreground transition-colors hover:text-accent"
              >
                <ExternalLink className="h-4 w-4" />
                Instagram
              </a>
            </div>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Šta da pošaljete
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-foreground/75">
              <li>Osnove prostora (2D ili PDF) ako postoje</li>
              <li>Fotografije postojećeg stanja</li>
              <li>Reference stila i atmosfere</li>
              <li>Okvirni obim i rok</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Iza brenda
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground/75">
              {SITE.name} je deo {SITE.parentCompany} — krovnog poslovnog
              entiteta sa iskustvom u 3D vizuelizaciji i digitalnim
              arhitektonskim sadržajima.
            </p>
          </div>
        </aside>
      </div>
      </div>
      <PreFooterCta
        heading="Više voliš da odmah vidiš cenu?"
        body="Otvori kalkulator i konfiguriši vizuelizaciju sam — cenu vidiš odmah, pre nego što pošalješ bilo kakav upit."
      />
    </>
  );
}
