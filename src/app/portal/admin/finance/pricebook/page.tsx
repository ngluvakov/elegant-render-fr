import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PricingWorkbench } from "./pricing-workbench";
import { requirePagePermission } from "@/lib/admin-auth";
import {
  getDraftPricingCatalog,
  getPublishedPricingCatalog,
} from "@/server/pricing/catalog";

export const metadata: Metadata = {
  title: "Admin — Grille tarifaire et finance",
  description:
    "Gestion admin de la grille tarifaire, des règles financières et de la publication des prix.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PricingFinancePage() {
  await requirePagePermission("FINANCE_MANAGE");
  const [draft, published] = await Promise.all([
    getDraftPricingCatalog(),
    getPublishedPricingCatalog(),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/portal/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Admin
      </Link>

      <PricingWorkbench initialDraft={draft} published={published} />
    </div>
  );
}
