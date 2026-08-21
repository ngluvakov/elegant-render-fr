/**
 * CategoryPreview — Five starting-price cards rendered above the configurator on /pricing.
 * Each card represents a customer-facing service group, shows its starting
 * price (derived live from the catalog), and links into the configurator with
 * the matching tab pre-selected.
 *
 * Visual: still WebP for four of the groups; the animation card renders a
 * looping muted MP4 so the card itself shows what the customer is buying.
 * All cards fall back to a lucide icon + gradient when the asset hasn't
 * loaded yet.
 *
 * Used on: /pricing page (between philosophy strip and PricingConfigurator).
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Camera,
  Glasses,
  Layers,
  Sofa,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CUSTOMER_GROUPS,
  type CustomerGroupId,
  type CustomerGroup,
  getGroupStartingPriceEur,
} from "@/lib/catalog/customer-groups";
import {
  CONFIGURATOR_CATEGORIES,
  type ConfiguratorCategory,
  type ConfiguratorProduct,
} from "@/lib/catalog/configurator";
import {
  formatPublicPrice,
  formatPublicPriceText,
  type DisplayCurrency,
} from "@/lib/catalog/display-currency";
import type { ResolvedPricingCatalog } from "@/lib/pricing/catalog";
import { track } from "@/lib/posthog-events";

/**
 * Find the first non-inquiryOnly product in a group that carries
 * displayPerUnitEur. Returns undefined when no product is annotated
 * (e.g. inquiry-only groups like VR).
 */
function getGroupDisplayProduct(
  group: CustomerGroup,
  categories: ConfiguratorCategory[],
): ConfiguratorProduct | undefined {
  for (const cat of categories) {
    if (!group.catIds.includes(cat.id)) continue;
    for (const prod of cat.products) {
      if (!prod.inquiryOnly && prod.displayPerUnitEur !== undefined) {
        return prod;
      }
    }
  }
  return undefined;
}

const GROUP_VISUALS: Record<
  CustomerGroupId,
  { icon: LucideIcon; gradient: string }
> = {
  "exterior-renders": {
    icon: Building2,
    gradient: "from-secondary to-secondary",
  },
  interior: {
    icon: Sofa,
    gradient: "from-secondary to-secondary",
  },
  plans: {
    icon: Layers,
    gradient: "from-secondary to-secondary",
  },
  animation: {
    icon: Camera,
    gradient: "from-secondary to-secondary",
  },
  "staging-renovation": {
    icon: Sparkles,
    gradient: "from-secondary to-secondary",
  },
  "vr-experience": {
    icon: Glasses,
    gradient: "from-secondary to-secondary",
  },
};

export function CategoryPreview({
  displayCurrency,
  pricingCatalog,
}: {
  displayCurrency: DisplayCurrency;
  pricingCatalog?: ResolvedPricingCatalog;
}) {
  const pricingSettings = pricingCatalog?.settings;
  const categories = pricingCatalog?.categories ?? CONFIGURATOR_CATEGORIES;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-5">
      {CUSTOMER_GROUPS.map((group) => {
        const startingEur = getGroupStartingPriceEur(group, categories);
        const displayProduct = getGroupDisplayProduct(group, categories);
        const visual = GROUP_VISUALS[group.id];
        return (
          <PreviewCard
            key={group.id}
            href={`/pricing?group=${group.id}#configurator`}
            label={group.label}
            shortLabel={group.shortLabel}
            blurb={group.blurb}
            startingEur={startingEur}
            displayPerUnitEur={displayProduct?.displayPerUnitEur}
            displayUnitLabel={displayProduct?.displayUnitLabel}
            displayPackageNote={displayProduct?.displayPackageNote}
            imageSrc={group.imageSrc}
            videoSrc={group.videoSrc}
            icon={visual.icon}
            gradient={visual.gradient}
            displayCurrency={displayCurrency}
            pricingSettings={pricingSettings}
            onClick={() =>
              track("category_preview_click", { group: group.id })
            }
          />
        );
      })}
    </div>
  );
}

function PreviewCard({
  href,
  label,
  shortLabel,
  blurb,
  startingEur,
  displayPerUnitEur,
  displayUnitLabel,
  displayPackageNote,
  imageSrc,
  videoSrc,
  icon: Icon,
  gradient,
  displayCurrency,
  pricingSettings,
  onClick,
}: {
  href: string;
  label: string;
  shortLabel: string;
  blurb: string;
  startingEur: number;
  displayPerUnitEur?: number;
  displayUnitLabel?: string;
  displayPackageNote?: string;
  imageSrc: string;
  videoSrc?: string;
  icon: LucideIcon;
  gradient: string;
  displayCurrency: DisplayCurrency;
  pricingSettings: Parameters<typeof formatPublicPrice>[2];
  onClick: () => void;
}) {
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const mediaAlt = `${label} — ${blurb}`;

  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-lg border border-border/40 bg-card/80 transition-all hover:border-accent/40 hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)]"
    >
      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden bg-gradient-to-br",
          gradient,
        )}
      >
        {/* Fallback icon visible until image / video loads. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-10 w-10 text-foreground/35" strokeWidth={1.5} />
        </div>
        {videoSrc ? (
          <video
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={mediaAlt}
            onLoadedData={() => setMediaLoaded(true)}
            onError={() => setMediaLoaded(false)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              mediaLoaded ? "opacity-100" : "opacity-0",
            )}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageSrc}
            alt={mediaAlt}
            loading="lazy"
            onLoad={() => setMediaLoaded(true)}
            onError={() => setMediaLoaded(false)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              mediaLoaded ? "opacity-100" : "opacity-0",
            )}
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-sm font-semibold text-foreground md:text-base">
          <span className="md:hidden">{shortLabel}</span>
          <span className="hidden md:inline">{label}</span>
        </h3>
        <p className="hidden text-xs leading-snug text-muted-foreground md:line-clamp-2 md:block">
          {blurb}
        </p>
        {displayPerUnitEur !== undefined && displayUnitLabel ? (
          <div className="mt-auto pt-2">
            <p>
              <span className="text-xs font-normal normal-case tracking-normal text-muted-foreground">
                dès{" "}
              </span>
              <span className="text-2xl font-bold text-foreground">
                {formatPublicPrice(displayPerUnitEur, displayCurrency, pricingSettings)}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {" "}/{" "}
                {formatPublicPriceText(
                  displayUnitLabel,
                  displayCurrency,
                  pricingSettings,
                )}
              </span>
            </p>
            {displayPackageNote && (
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                {formatPublicPriceText(
                  displayPackageNote,
                  displayCurrency,
                  pricingSettings,
                )}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-auto pt-2 text-xs text-muted-foreground">
            dès{" "}
            <span className="text-base font-bold text-foreground">
              {formatPublicPrice(startingEur, displayCurrency, pricingSettings)}
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}
