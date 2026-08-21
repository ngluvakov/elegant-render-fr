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
    "Contactez-nous. Envoyez une courte description de votre projet — nous répondons généralement le jour même (jour ouvré).",
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
              "Formulaire de contact pour rendus d’intérieur et d’extérieur, plans 3D, home staging virtuel et retouche photo immobilière par IA.",
          }),
          buildBreadcrumbJsonLd([
            { name: "Accueil", path: "/" },
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
        Contactez-nous
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
        Dites-nous ce dont vous avez besoin — l’espace, l’étendue du projet et
        le délai — et nous répondons généralement le jour même (jour ouvré)
        avec un devis clair.
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
              Contact direct
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
              Quoi envoyer
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-foreground/75">
              <li>Plans (2D ou PDF) si disponibles</li>
              <li>Photos de l’état actuel</li>
              <li>Références de style et d’ambiance</li>
              <li>Étendue approximative et délai souhaité</li>
            </ul>
          </div>
          <div>
            <h2 className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Derrière la marque
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground/75">
              {SITE.name} fait partie de {SITE.parentCompany} — l’entité
              faîtière, forte d’une expérience en visualisation 3D et en
              contenus architecturaux numériques.
            </p>
          </div>
        </aside>
      </div>
      </div>
      <PreFooterCta
        heading="Vous préférez voir le prix tout de suite ?"
        body="Ouvrez le calculateur et configurez vous-même votre visualisation — le prix s’affiche immédiatement, avant même d’envoyer une demande."
      />
    </>
  );
}
