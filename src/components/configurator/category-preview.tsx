/**
 * CategoryPreview — Five starting-price cards rendered above the configurator on /cene.
 * Each card represents a customer-facing service group, shows its starting
 * price (derived live from the catalog), and links into the configurator with
 * the matching tab pre-selected.
 *
 * Visual: still WebP for four of the groups; the animacija card renders a
 * looping muted MP4 so the card itself shows what the customer is buying.
 * All cards fall back to a lucide icon + gradient when the asset hasn't
 * loaded yet.
 *
 * Used on: /cene page (between philosophy strip and PricingConfigurator).
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Camera,
  Layers,
  Sofa,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CUSTOMER_GROUPS,
  type CustomerGroupId,
  getGroupStartingPriceEur,
} from "@/lib/catalog/customer-groups";
import { formatPublicPrice } from "@/lib/catalog/display-currency";
import { track } from "@/lib/posthog-events";

const GROUP_VISUALS: Record<
  CustomerGroupId,
  { icon: LucideIcon; gradient: string }
> = {
  "renderi-eksterijera": {
    icon: Building2,
    gradient: "from-[color:var(--color-sage)]/15 to-[color:var(--color-sage-deep)]/25",
  },
  enterijer: {
    icon: Sofa,
    gradient: "from-accent/15 to-accent/25",
  },
  planovi: {
    icon: Layers,
    gradient: "from-foreground/10 to-foreground/20",
  },
  animacija: {
    icon: Camera,
    gradient: "from-accent/20 to-[color:var(--color-sage-deep)]/20",
  },
  "opremanje-renovacija": {
    icon: Sparkles,
    gradient: "from-[color:var(--color-sage)]/20 to-accent/15",
  },
};

export function CategoryPreview() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-5">
      {CUSTOMER_GROUPS.map((group) => {
        const startingEur = getGroupStartingPriceEur(group);
        const visual = GROUP_VISUALS[group.id];
        return (
          <PreviewCard
            key={group.id}
            href={`/cene?group=${group.id}#configurator`}
            label={group.label}
            shortLabel={group.shortLabel}
            blurb={group.blurb}
            startingEur={startingEur}
            imageSrc={group.imageSrc}
            videoSrc={group.videoSrc}
            icon={visual.icon}
            gradient={visual.gradient}
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
  imageSrc,
  videoSrc,
  icon: Icon,
  gradient,
  onClick,
}: {
  href: string;
  label: string;
  shortLabel: string;
  blurb: string;
  startingEur: number;
  imageSrc: string;
  videoSrc?: string;
  icon: LucideIcon;
  gradient: string;
  onClick: () => void;
}) {
  const [mediaLoaded, setMediaLoaded] = useState(false);

  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/80 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_18px_44px_rgba(28,26,25,0.08)]"
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
            aria-label={label}
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
            alt={label}
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
        <p className="mt-auto pt-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          od{" "}
          <span className="text-base font-bold normal-case tracking-normal text-foreground">
            {formatPublicPrice(startingEur)}
          </span>
        </p>
      </div>
    </Link>
  );
}
