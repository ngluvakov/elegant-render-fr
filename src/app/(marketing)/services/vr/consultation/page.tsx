/**
 * /services/vr/consultation — Public intake page for VR consultation.
 *
 * VR products bypass the cart/payment flow because scope and target
 * device need agreement before commitment. Customers fill the form
 * here; the team reviews + holds a meeting + creates a custom order.
 *
 * Accepts a `?p=<productId>` query param to pre-select vr-existing
 * vs vr-standalone.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import type { VrProductId } from "@/lib/catalog/vr-config";
import {
  SEO,
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  createPublicMetadata,
} from "@/lib/seo";
import { VrInquiryForm } from "./inquiry-form";

const VR_CONSULTATION_DESCRIPTION =
  "Demandez une consultation pour une visite en réalité virtuelle (VR). L’équipe répond sous 1 jour ouvré avec une proposition de périmètre et les détails techniques.";

export const metadata: Metadata = createPublicMetadata({
  title: "Consultation VR",
  description: VR_CONSULTATION_DESCRIPTION,
  path: "/services/vr/consultation",
});

const VALID_VR_IDS: VrProductId[] = ["vr-existing", "vr-standalone"];

function pickInitialProductId(raw: string | string[] | undefined): VrProductId {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value === "string" && VALID_VR_IDS.includes(value as VrProductId)) {
    return value as VrProductId;
  }
  return "vr-existing";
}

export default async function VrConsultationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialProductId = pickInitialProductId(params.p);

  // Pre-fill contact info if logged in
  const session = await auth();
  let initialContact: { name?: string; email?: string; phone?: string } = {};
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    });
    if (user) {
      initialContact = {
        name: user.name ?? undefined,
        email: user.email,
        phone: user.phone ?? undefined,
      };
    }
  }

  // Fetch product labels for both options so the form can render the picker
  const products = VALID_VR_IDS.map((id) => {
    const lookup = getConfiguratorProduct(id);
    return {
      id,
      label: lookup?.product.label ?? id,
      basePriceEur: lookup?.product.basePriceEur ?? 0,
    };
  });

  return (
    <>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            path: "/services/vr/consultation",
            name: "Consultation VR",
            description: VR_CONSULTATION_DESCRIPTION,
          }),
          buildBreadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            { name: "Services", path: "/services" },
            { name: "Consultation VR", path: "/services/vr/consultation" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": `${absoluteUrl("/services/vr/consultation")}#service`,
            name: "Consultation pour visite en réalité virtuelle (VR)",
            serviceType: "Visite en réalité virtuelle",
            description: VR_CONSULTATION_DESCRIPTION,
            url: absoluteUrl("/services/vr/consultation"),
            provider: {
              "@id": SEO.organizationId,
            },
            areaServed: ["FR", "EU", "Worldwide"],
            offers: {
              "@type": "OfferCatalog",
              name: "Options de visite en réalité virtuelle",
              itemListElement: products.map((product) => ({
                "@type": "Offer",
                name: product.label,
                price: product.basePriceEur,
                priceCurrency: "EUR",
                availability: "https://schema.org/PreOrder",
                url: absoluteUrl("/services/vr/consultation"),
              })),
            },
          },
        ]}
      />
      <div className="mx-auto w-full max-w-[min(96vw,1200px)] px-6 pb-24 pt-20 md:pt-28">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Retour aux tarifs
        </Link>
        <p className="section-kicker mt-4">Visite en réalité virtuelle</p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-[1.1] text-foreground md:text-5xl">
          Demander une consultation VR
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Les projets VR demandent un échange sur le périmètre, les appareils
          cibles et les détails techniques avant le début de la production.
          Renseignez ce que vous savez déjà — nous répondons sous{" "}
          <strong className="text-foreground">1 jour ouvré</strong>.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <VrInquiryForm
              initialProductId={initialProductId}
              initialContact={initialContact}
              products={products}
            />
          </div>

          <aside className="space-y-6 self-start rounded-xl border border-border/60 bg-secondary/30 p-6">
            <div>
              <h2 className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Ce que la consultation comprend
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                <li>Un appel de 30 à 45 minutes avec l’équipe technique</li>
                <li>Une évaluation du périmètre et des appareils cibles</li>
                <li>Une proposition d’éléments interactifs</li>
                <li>Un devis concret et un calendrier</li>
              </ul>
            </div>
            <div>
              <h2 className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Utile à préparer avant l’appel
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                <li>Les informations de base sur le bien (nombre de pièces, m²)</li>
                <li>Des références d’expériences VR qui vous plaisent</li>
                <li>Un calendrier approximatif et l’objectif (présentation, vente, formation)</li>
                <li>Un modèle 3D existant si vous en avez un</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
