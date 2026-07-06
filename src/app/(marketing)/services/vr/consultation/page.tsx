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
  "Request a consultation for a VR walkthrough. The team replies within 1 working day with a proposed scope and technical details.";

export const metadata: Metadata = createPublicMetadata({
  title: "VR consultation",
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
            name: "VR consultation",
            description: VR_CONSULTATION_DESCRIPTION,
          }),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: "VR consultation", path: "/services/vr/consultation" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": `${absoluteUrl("/services/vr/consultation")}#service`,
            name: "VR walkthrough consultation",
            serviceType: "VR walkthrough",
            description: VR_CONSULTATION_DESCRIPTION,
            url: absoluteUrl("/services/vr/consultation"),
            provider: {
              "@id": SEO.organizationId,
            },
            areaServed: ["RS", "EU", "Worldwide"],
            offers: {
              "@type": "OfferCatalog",
              name: "VR walkthrough options",
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
          Back to pricing
        </Link>
        <p className="section-kicker mt-4">VR walkthrough</p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-[1.1] text-foreground md:text-5xl">
          Request a VR consultation
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          VR projects call for a conversation about scope, target devices and
          technical details before production begins. Fill in what you already
          know — we reply within{" "}
          <strong className="text-foreground">1 working day</strong>.
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
                What the consultation includes
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                <li>A 30–45 minute call with the technical team</li>
                <li>An assessment of scope and target devices</li>
                <li>A proposal for interactive elements</li>
                <li>A concrete estimate and timeline</li>
              </ul>
            </div>
            <div>
              <h2 className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Useful to have before the call
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                <li>Basic information about the property (number of rooms, m²)</li>
                <li>References of VR experiences you like</li>
                <li>A rough timeline and purpose (presentation, sales, training)</li>
                <li>An existing 3D model if you have one</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
