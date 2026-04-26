/**
 * /usluge/vr/konsultacija — Public intake page for VR consultation.
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
import { SectionKicker } from "@/components/brand/section-kicker";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import type { VrProductId } from "@/lib/catalog/vr-config";
import { VrInquiryForm } from "./inquiry-form";

export const metadata: Metadata = {
  title: "VR konsultacija — Elegant Render",
  description:
    "Zatražite konsultaciju za VR walkthrough. Tim se javlja u roku od 1 radnog dana sa predlogom opsega i tehničkih detalja.",
  openGraph: {
    title: "VR konsultacija — Elegant Render",
    description:
      "Zatražite konsultaciju za VR walkthrough. Tim se javlja u roku od 1 radnog dana.",
    url: "/usluge/vr/konsultacija",
  },
};

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
    <div className="mx-auto w-full max-w-[min(96vw,1200px)] px-6 pb-24 pt-20 md:pt-28">
      <Link
        href="/cene"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Nazad na cene
      </Link>
      <SectionKicker className="mt-4">VR Walkthrough</SectionKicker>
      <h1 className="mt-4 max-w-3xl text-4xl leading-[1.1] text-foreground md:text-5xl">
        Zatražite VR konsultaciju
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
        VR projekti zahtevaju razgovor o opsegu, target uređajima i tehničkim
        detaljima pre nego što počnemo izradu. Popunite šta već znate — javljamo
        se u roku od <strong className="text-foreground">1 radnog dana</strong>.
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
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Šta uključuje konsultacija
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-foreground/80">
              <li>Razgovor 30–45 min sa tehničkim timom</li>
              <li>Procena opsega i target uređaja</li>
              <li>Predlog interaktivnih elemenata</li>
              <li>Konkretna ponuda i rok</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
              Pre razgovora dobro je da imate
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-foreground/80">
              <li>Osnovne informacije o objektu (broj prostorija, m²)</li>
              <li>Reference VR iskustava koja vam se sviđaju</li>
              <li>Okvirni rok i namenu (prezentacija, prodaja, treninzi)</li>
              <li>Postojeći 3D model ako ga imate</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
