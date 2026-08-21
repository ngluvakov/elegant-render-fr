/**
 * ToolPickerCard — entry-card for the AI Studio tool picker on /ai-studio.
 *
 * When both `beforeSrc` and `afterSrc` are provided, the card renders a
 * diagonal before/after reveal (via BeforeAfterReveal) that follows the
 * mouse on hover (desktop) and plays a one-time demo when the card
 * scrolls into view (mobile / pointer-coarse).
 *
 * Without a complete pair, the card falls back to an icon on a flat
 * neutral surface (or a single legacy `imageSrc` overlay) — same shape
 * it had before this was added, so partial roll-out works.
 *
 * Used on: /ai-studio (page.tsx -> ToolPickerSection).
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Armchair,
  CloudSun,
  Eraser,
  Paintbrush,
  Palette,
  Sofa,
  Sun,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { BeforeAfterReveal } from "@/components/marketing/before-after-reveal";

/**
 * Lucide icon components are React functions, so they can't cross the
 * server → client component boundary as a prop (RSC serialization
 * forbids passing functions). Page.tsx (server) sends the icon NAME as a
 * string and we resolve it here on the client side. Add a new key when
 * a new tool needs an icon.
 */
export type ToolPickerIconName =
  | "eraser"
  | "sun"
  | "cloud-sun"
  | "paintbrush"
  | "sofa"
  | "armchair"
  | "wand"
  | "palette";

const ICON_MAP: Record<ToolPickerIconName, LucideIcon> = {
  eraser: Eraser,
  sun: Sun,
  "cloud-sun": CloudSun,
  paintbrush: Paintbrush,
  sofa: Sofa,
  armchair: Armchair,
  wand: Wand2,
  palette: Palette,
};

type Props = {
  href: string;
  label: string;
  shortLabel: string;
  blurb: string;
  imageSrc?: string;
  beforeSrc?: string;
  afterSrc?: string;
  iconName: ToolPickerIconName;
  creditsLabel: string;
  startingRsdLabel: string;
};

const CARD_CLASS =
  "group flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/80 transition-[border-color,box-shadow] duration-200 hover:border-[#d4d4d4] hover:shadow-[0_1px_3px_rgba(17,17,17,0.06)] focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function ToolPickerCard(props: Props) {
  const hasPair = !!props.beforeSrc && !!props.afterSrc;
  if (!hasPair) {
    return <FallbackCard {...props} />;
  }
  return <BeforeAfterCard {...props} />;
}

// ─── Before/after variant (diagonal reveal) ──────────────────────────────

function BeforeAfterCard({
  href,
  label,
  shortLabel,
  blurb,
  beforeSrc,
  afterSrc,
  iconName,
  creditsLabel,
  startingRsdLabel,
}: Props) {
  const Icon = ICON_MAP[iconName];

  return (
    <Link href={href} className={CARD_CLASS}>
      <BeforeAfterReveal
        beforeSrc={beforeSrc!}
        afterSrc={afterSrc!}
        alt={`Après retouche IA : ${label}`}
        beforeAlt={`Avant retouche IA : ${label}`}
        afterAlt={`Après retouche IA : ${label}`}
        sizes="(max-width: 768px) 50vw, 25vw"
        autoDemoIntervalMs={7000}
        className="aspect-[4/3] bg-secondary"
        fallback={
          <Icon className="h-10 w-10 text-foreground/35" strokeWidth={1.5} />
        }
      >
        {/* "Avant / après" hint fades out once the card is being interacted with. */}
        <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-foreground/55 px-2 py-1 font-mono text-xs font-medium uppercase tracking-[0.08em] text-background/95 opacity-90 transition-opacity duration-200 group-hover:opacity-0">
          Avant / après
        </span>
      </BeforeAfterReveal>
      <CardFooter
        label={label}
        shortLabel={shortLabel}
        blurb={blurb}
        creditsLabel={creditsLabel}
        startingRsdLabel={startingRsdLabel}
      />
    </Link>
  );
}

// ─── Fallback variant (no before/after pair available) ───────────────────

function FallbackCard({
  href,
  label,
  shortLabel,
  blurb,
  imageSrc,
  iconName,
  creditsLabel,
  startingRsdLabel,
}: Props) {
  const Icon = ICON_MAP[iconName];
  return (
    <Link href={href} className={CARD_CLASS}>
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-10 w-10 text-foreground/35" strokeWidth={1.5} />
        </div>
        {imageSrc && (
          <Image
            src={imageSrc}
            alt={`${label} - exemple d’outil AI Studio`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        )}
      </div>
      <CardFooter
        label={label}
        shortLabel={shortLabel}
        blurb={blurb}
        creditsLabel={creditsLabel}
        startingRsdLabel={startingRsdLabel}
      />
    </Link>
  );
}

// ─── Shared footer ───────────────────────────────────────────────────────

function CardFooter({
  label,
  shortLabel,
  blurb,
  creditsLabel,
  startingRsdLabel,
}: {
  label: string;
  shortLabel: string;
  blurb: string;
  creditsLabel: string;
  startingRsdLabel: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5 p-4">
      <h3 className="text-sm font-semibold text-foreground md:text-base">
        <span className="md:hidden">{shortLabel}</span>
        <span className="hidden md:inline">{label}</span>
      </h3>
      <p className="hidden text-xs leading-snug text-muted-foreground md:line-clamp-2 md:block">
        {blurb}
      </p>
      <div className="mt-auto flex items-baseline justify-between gap-2 pt-1">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          dès{" "}
          <span className="font-sans text-base font-bold normal-case tracking-normal text-foreground">
            {startingRsdLabel}
          </span>
        </p>
        <span className="text-[0.65rem] text-muted-foreground">
          {creditsLabel}
        </span>
      </div>
    </div>
  );
}
