"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ServiceMatrixSidebar } from "./service-matrix-sidebar";
import { ServiceMatrixTable } from "./service-matrix-table";
import { ServiceDetailDrawer } from "./service-detail-drawer";
import { useQuote } from "./quote-context";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";
import { DEFAULT_CAT, MATRIX_CAT_PARAM } from "./service-matrix-shared";

export function ServiceMatrix() {
  const sp = useSearchParams();
  const activeCat = sp.get(MATRIX_CAT_PARAM) ?? DEFAULT_CAT;

  const { pricingCatalog } = useQuote();
  const categories = pricingCatalog?.categories ?? CONFIGURATOR_CATEGORIES;

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);

  let detailProduct = null;
  let detailCategory = null;
  if (activeDetailId) {
    for (const cat of categories) {
      const product = cat.products.find((p) => p.id === activeDetailId);
      if (product) {
        detailProduct = product;
        detailCategory = cat;
        break;
      }
    }
  }

  return (
    <section
      id="usluge"
      className="mx-auto w-full max-w-[min(96vw,1720px)] scroll-mt-24 px-6 pb-10 pt-8"
    >
      <header className="mb-4 flex items-baseline justify-between gap-4 px-1">
        <h2 className="text-xl font-semibold leading-tight text-foreground md:text-2xl">
          Izaberi uslugu
        </h2>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Pređi mišem preko usluge da vidiš popust na povezane.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <ServiceMatrixSidebar activeCat={activeCat} />
        <div className="min-w-0">
          <ServiceMatrixTable
            activeCat={activeCat}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onInfoClick={setActiveDetailId}
          />
        </div>
      </div>

      <ServiceDetailDrawer
        product={detailProduct}
        category={detailCategory}
        open={activeDetailId !== null}
        onOpenChange={(open) => {
          if (!open) setActiveDetailId(null);
        }}
      />
    </section>
  );
}
