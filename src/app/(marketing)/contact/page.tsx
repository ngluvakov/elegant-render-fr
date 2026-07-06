import type { Metadata } from "next";
import { ExternalLink, Mail } from "lucide-react";
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
  title: "Contact",
  description:
    "Get in touch. Send a short project description and we usually reply the same working day.",
  path: "/contact",
});

export default async function ContactPage() {
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
            name: "Contact",
            description:
              "Contact form for interior and exterior renders, 3D floor plans, virtual staging and AI real-estate photo editing.",
          }),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: "Contact - Elegant Render",
            url: `${SITE.url}/contact`,
            mainEntity: {
              "@id": `${SITE.url}/#organization`,
            },
          },
          buildOrganizationJsonLd(),
        ]}
      />
      <p className="section-kicker">Contact</p>
      <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-foreground md:text-6xl">
        Get in touch
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
        Tell us what you need — the space, the scope and the deadline — and we
        usually reply the same working day with a clear estimate.
      </p>

      <div className="mt-16 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8">
          <ProjectInquiryForm
            mode="contact"
            source={{
              source: "contact-page",
              sourcePath: "/contact",
              sourceLabel: "Contact form",
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
            <h2 className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Direct contact
            </h2>
            <div className="mt-4 space-y-3">
              <a
                href={`mailto:${SITE.email}`}
                className="flex items-center gap-3 text-foreground transition-colors duration-200 hover:text-accent"
              >
                <Mail className="h-4 w-4" />
                {SITE.email}
              </a>
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-foreground transition-colors duration-200 hover:text-accent"
              >
                <ExternalLink className="h-4 w-4" />
                Instagram
              </a>
            </div>
          </div>
          <div>
            <h2 className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              What to send
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-foreground/75">
              <li>Floor plans (2D or PDF) if available</li>
              <li>Photos of the current state</li>
              <li>Style and mood references</li>
              <li>Approximate scope and deadline</li>
            </ul>
          </div>
          <div>
            <h2 className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Behind the brand
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground/75">
              {SITE.name} is part of {SITE.parentCompany} — the umbrella
              business entity with experience in 3D visualization and digital
              architectural content.
            </p>
          </div>
        </aside>
      </div>
      </div>
      <PreFooterCta
        heading="Prefer to see the price right away?"
        body="Open the calculator and configure your visualization yourself — you see the price immediately, before sending any inquiry."
      />
    </>
  );
}
