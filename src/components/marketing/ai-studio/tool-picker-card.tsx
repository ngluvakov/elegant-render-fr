/**
 * ToolPickerCard — entry-card for the AI Studio tool picker on /ai-studio.
 *
 * When both `beforeSrc` and `afterSrc` are provided, the card renders a
 * diagonal before/after reveal: a 135deg gradient mask cuts the after
 * image, leaving the before image visible underneath. The reveal position
 * follows the mouse on hover (desktop) and plays a one-time demo
 * animation when the card scrolls into view (mobile / pointer-coarse).
 *
 * Without a complete pair, the card falls back to an icon + gradient (or
 * a single legacy `imageSrc` overlay) — same shape it had before this
 * was added, so partial roll-out works.
 *
 * Used on: /ai-studio (page.tsx -> ToolPickerSection).
 */
"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  label: string;
  shortLabel: string;
  blurb: string;
  imageSrc?: string;
  beforeSrc?: string;
  afterSrc?: string;
  icon: LucideIcon;
  gradient: string;
  creditsLabel: string;
  startingEurLabel: string;
};

const DEFAULT_REVEAL = 50;
const DEMO_VIEWPORT_THRESHOLD = 0.4;

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
  icon: Icon,
  gradient,
  creditsLabel,
  startingEurLabel,
}: Props) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);

  /**
   * Set --reveal directly on the DOM (no React state) so mouse-move
   * doesn't trigger React renders — perf matters with 7 cards on screen.
   */
  const setReveal = (value: number) => {
    const el = mediaRef.current;
    if (!el) return;
    el.style.setProperty(
      "--reveal",
      String(Math.max(0, Math.min(100, value))),
    );
  };

  // ── Mobile demo animation: plays once when the card enters viewport.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    // Only auto-demo on coarse pointers (touch); desktop hover handles it.
    const isCoarse = window.matchMedia("(hover: none)").matches;
    if (!isCoarse) return;

    const card = cardRef.current;
    if (!card) return;

    let played = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          played = false; // re-arm so re-entering replays the demo
          return;
        }
        if (played) return;
        played = true;
        playDemoAnimation(setReveal, animatingRef);
      },
      { threshold: DEMO_VIEWPORT_THRESHOLD },
    );
    obs.observe(card);
    return () => obs.disconnect();
  }, []);

  const onMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (animatingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const W = rect.width;
    const H = rect.height;
    if (W === 0 || H === 0) return;
    // Project (px, py) onto the 135deg gradient line. For a non-square box
    // the projection coefficient depends on aspect ratio; using the exact
    // formula keeps the boundary line visually anchored to the mouse.
    const reveal = ((px * W + py * H) / (W * W + H * H)) * 100;
    setReveal(reveal);
  };

  const onMouseLeave = () => {
    if (animatingRef.current) return;
    setReveal(DEFAULT_REVEAL);
  };

  return (
    <Link
      ref={cardRef}
      href={href}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/80 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_18px_44px_rgba(28,26,25,0.08)]"
    >
      <div
        ref={mediaRef}
        className={cn(
          "relative aspect-[4/3] overflow-hidden bg-gradient-to-br",
          "before-after-media",
          gradient,
        )}
        style={{ "--reveal": DEFAULT_REVEAL } as React.CSSProperties}
      >
        {/* Loading fallback — visible until images decode. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-10 w-10 text-foreground/35" strokeWidth={1.5} />
        </div>
        {/* Before (full image, bottom layer). */}
        <Image
          src={beforeSrc!}
          alt=""
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
        />
        {/* After (top layer, masked diagonally — upper-left visible by default). */}
        <Image
          src={afterSrc!}
          alt={label}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="before-after-after-layer object-cover"
        />
        {/* Hairline along the diagonal — anchors the divider visually. */}
        <div className="before-after-divider pointer-events-none absolute inset-0" />
        {/* Discreet "hover to reveal" hint for desktop, "see comparison" on mobile.
            Fades out once the customer has interacted with the card at all. */}
        <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-foreground/55 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-background/95 opacity-90 transition-opacity duration-300 group-hover:opacity-0">
          Pre / posle
        </span>
      </div>
      <CardFooter
        label={label}
        shortLabel={shortLabel}
        blurb={blurb}
        creditsLabel={creditsLabel}
        startingEurLabel={startingEurLabel}
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
  icon: Icon,
  gradient,
  creditsLabel,
  startingEurLabel,
}: Props) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/80 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_18px_44px_rgba(28,26,25,0.08)]"
    >
      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden bg-gradient-to-br",
          gradient,
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-10 w-10 text-foreground/35" strokeWidth={1.5} />
        </div>
        {imageSrc && (
          <Image
            src={imageSrc}
            alt={label}
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
        startingEurLabel={startingEurLabel}
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
  startingEurLabel,
}: {
  label: string;
  shortLabel: string;
  blurb: string;
  creditsLabel: string;
  startingEurLabel: string;
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
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          od{" "}
          <span className="text-base font-bold normal-case tracking-normal text-foreground">
            {startingEurLabel}
          </span>
        </p>
        <span className="text-[0.65rem] text-muted-foreground">
          {creditsLabel}
        </span>
      </div>
    </div>
  );
}

// ─── Demo animation (mobile / coarse pointer first-view) ─────────────────

type DemoSegment = { from: number; to: number; durationMs: number };

const DEMO_SEGMENTS: readonly DemoSegment[] = [
  { from: 50, to: 100, durationMs: 700 }, // wipe to "after fully visible"
  { from: 100, to: 0, durationMs: 900 }, // wipe across to "before fully visible"
  { from: 0, to: 50, durationMs: 500 }, // settle back to default
];

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Drives --reveal through DEMO_SEGMENTS via requestAnimationFrame. Stays
 * entirely in DOM-set property updates so React doesn't re-render per frame.
 */
function playDemoAnimation(
  setReveal: (n: number) => void,
  animatingRef: React.MutableRefObject<boolean>,
) {
  if (animatingRef.current) return;
  animatingRef.current = true;

  let segIdx = 0;
  let segStart = performance.now();

  const step = (now: number) => {
    const seg = DEMO_SEGMENTS[segIdx];
    const elapsed = now - segStart;
    const t = Math.min(1, elapsed / seg.durationMs);
    setReveal(seg.from + (seg.to - seg.from) * easeInOutQuad(t));

    if (t < 1) {
      requestAnimationFrame(step);
      return;
    }
    segIdx++;
    if (segIdx < DEMO_SEGMENTS.length) {
      segStart = now;
      requestAnimationFrame(step);
      return;
    }
    animatingRef.current = false;
  };

  requestAnimationFrame(step);
}
