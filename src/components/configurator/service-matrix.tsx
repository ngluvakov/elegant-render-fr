"use client";

import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceMatrixSidebar } from "./service-matrix-sidebar";
import { ServiceMatrixTable } from "./service-matrix-table";
import { ServiceDetailDrawer } from "./service-detail-drawer";
import { useQuote } from "./quote-context";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";
import { DEFAULT_CAT, MATRIX_CAT_PARAM } from "./service-matrix-shared";

type Props = {
  cartSlot?: ReactNode;
};

export function ServiceMatrix({ cartSlot }: Props = {}) {
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

  const hasCart = cartSlot != null;

  return (
    <section
      id="usluge"
      className="mx-auto w-full max-w-[min(96vw,1720px)] scroll-mt-24 px-6 pb-10 pt-8"
    >
      <header className="mb-4 px-1">
        <h2 className="text-xl font-semibold leading-tight text-foreground md:text-2xl">
          Izaberi uslugu
        </h2>
      </header>

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/[0.06] p-4 md:p-5">
        <Percent className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <div>
          <p className="text-base md:text-lg font-medium leading-snug text-foreground">
            Usluge postaju jeftinije u kombinaciji sa drugim uslugama.
          </p>
          <p className="mt-1 text-sm md:text-[0.95rem] leading-relaxed text-muted-foreground">
            Isprobajte kombinaciju usluga koja Vama treba i saznajte koliko biste uštedeli.
          </p>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]",
          hasCart && "xl:grid-cols-[240px_minmax(0,1fr)_380px]",
        )}
      >
        <ServiceMatrixSidebar activeCat={activeCat} />
        <div className="min-w-0">
          <ServiceMatrixTable
            activeCat={activeCat}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onInfoClick={setActiveDetailId}
          />
        </div>
        {hasCart && (
          <aside className="hidden xl:block xl:sticky xl:top-20 xl:self-start">
            {cartSlot}
          </aside>
        )}
      </div>

      {hasCart && (
        <div className="mt-6 xl:hidden">
          {cartSlot}
        </div>
      )}

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
