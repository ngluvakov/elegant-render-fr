/**
 * BeforeAfterReveal — diagonal before/after image reveal that tracks the
 * mouse on desktop, then on coarse pointers demos itself on viewport entry
 * before switching to a scroll-driven reveal.
 *
 * Hover always wins over the auto-demo swipe: the cursor entering the image
 * cancels any demo in flight, and `runDemo` refuses to start one while the
 * pointer is inside. See the contract in `before-after-demo-animation.ts`.
 *
 * Auto-demo ticks come from a single page-load clock (DEMO_CLOCK_ORIGIN):
 * the first tick lands ~0.8s after hydration, later ticks every intervalMs.
 * Every slider — first row, second row, or scrolled in later — swipes only
 * on these shared ticks, so the whole page demos in unison.
 *
 * Drives the `--reveal` CSS custom property directly on the DOM (no React
 * state per frame) so mouse-move stays cheap. Styling lives in
 * `src/app/globals.css` under `.before-after-media`, `.before-after-after-layer`,
 * `.before-after-divider`, with `@property --reveal` registered for smooth
 * transitions.
 *
 * Used by: tool-picker-card (AI Studio tool picker), the AI Studio landing
 * page, the service detail pages and the services showcase.
 */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { playBeforeAfterDemoAnimation } from "@/components/marketing/before-after-demo-animation";
import { useMobileBeforeAfterScrollReveal } from "@/components/marketing/use-mobile-before-after-scroll-reveal";

const DEFAULT_REVEAL = 50;

// One demo clock per page load, shared by every instance: the first tick
// lands shortly after hydration, later ticks every intervalMs from that
// origin. Cards in any row — visible at load or scrolled in later — only
// swipe on these shared ticks, so the whole page swipes in unison.
const DEMO_CLOCK_ORIGIN =
  typeof performance !== "undefined" ? performance.now() : 0;
const DEMO_FIRST_TICK_DELAY_MS = 800;

type Props = {
  beforeSrc: string;
  afterSrc: string;
  alt: string;
  beforeAlt?: string;
  afterAlt?: string;
  /** Sizes hint for next/image. Defaults to a mid-page card. */
  sizes?: string;
  /** Classes for the outer media div — caller controls aspect ratio, radius, bg. */
  className?: string;
  /** Rendered behind the images (e.g. loader icon). */
  fallback?: ReactNode;
  /** Rendered above the divider (e.g. "Pre / posle" badge). */
  children?: ReactNode;
  /** Optional automatic demo replay. Used by the home page preview. */
  autoDemoIntervalMs?: number;
  /** Changes force a fresh demo when auto demo is enabled. */
  demoReplayKey?: string | number;
};

export function BeforeAfterReveal({
  beforeSrc,
  afterSrc,
  alt,
  beforeAlt = `Before: ${alt}`,
  afterAlt = `After: ${alt}`,
  sizes = "(max-width: 768px) 100vw, 55vw",
  className,
  fallback,
  children,
  autoDemoIntervalMs,
  demoReplayKey,
}: Props) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);
  const cancelDemoRef = useRef<(() => void) | null>(null);
  const pointerInsideRef = useRef(false);
  const pointerLeftAtRef = useRef(0);
  const coarsePointerRef = useRef<boolean | null>(null);

  const setReveal = useCallback((value: number) => {
    const el = mediaRef.current;
    if (!el) return;
    el.style.setProperty(
      "--reveal",
      String(Math.max(0, Math.min(100, value))),
    );
  }, []);

  const cancelInFlightDemo = useCallback(() => {
    cancelDemoRef.current?.();
    cancelDemoRef.current = null;
  }, []);

  // Resolved once on the first pointer event — mouse-move fires ~100×/s and
  // matchMedia allocates a fresh MediaQueryList on every call.
  const isCoarsePointer = () => {
    if (coarsePointerRef.current === null) {
      coarsePointerRef.current =
        typeof window !== "undefined" &&
        window.matchMedia("(hover: none), (pointer: coarse)").matches;
    }
    return coarsePointerRef.current;
  };

  useMobileBeforeAfterScrollReveal({
    mediaRef,
    animatingRef,
    setReveal,
    demoReplayKey,
    demoIntervalMs: autoDemoIntervalMs,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!autoDemoIntervalMs) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      setReveal(DEFAULT_REVEAL);
      return;
    }

    const isCoarse = window.matchMedia(
      "(hover: none), (pointer: coarse)",
    ).matches;
    if (isCoarse) return;

    const el = mediaRef.current;
    if (!el) return;

    const intervalMs = autoDemoIntervalMs;
    let tickId: number | null = null;

    const stopTick = () => {
      if (tickId === null) return;
      window.clearTimeout(tickId);
      tickId = null;
    };

    // Every instance schedules against the shared page clock (see
    // DEMO_CLOCK_ORIGIN): first tick ~0.8s after load, then every
    // intervalMs. No per-entry solo demos — rows entering the viewport
    // later simply join the next shared tick.
    let lastDemoAt = 0;
    const msUntilNextTick = () => {
      const sinceFirst =
        performance.now() - DEMO_CLOCK_ORIGIN - DEMO_FIRST_TICK_DELAY_MS;
      return sinceFirst < 0
        ? -sinceFirst
        : intervalMs - (sinceFirst % intervalMs) || intervalMs;
    };
    const scheduleAlignedTick = () => {
      stopTick();
      tickId = window.setTimeout(() => {
        // Skip a tick landing right after a replay-key demo — one swipe,
        // not two back to back.
        if (performance.now() - lastDemoAt >= intervalMs / 2) runDemo();
        scheduleAlignedTick();
      }, msUntilNextTick());
    };

    // The timer keeps ticking while the cursor is inside; this is the single
    // gate that decides whether a tick becomes a swipe. Gating here rather
    // than suspending the timer means a stuck `:hover` (hybrid touch+mouse
    // laptops) self-heals on the next tick instead of parking the demo for good.
    const runDemo = () => {
      // Hover always wins. `matches(":hover")` catches what pointerenter
      // cannot: the card scrolling under a stationary cursor, and the
      // pre-hydration window where the div is hoverable but has no handlers.
      if (pointerInsideRef.current || el.matches(":hover")) return;
      // Give a full interval of calm after the cursor leaves, otherwise a tick
      // landing milliseconds later reads as the swipe chasing the user out.
      if (
        pointerLeftAtRef.current &&
        performance.now() - pointerLeftAtRef.current < intervalMs
      ) {
        return;
      }
      cancelInFlightDemo();
      lastDemoAt = performance.now();
      // playBeforeAfterDemoAnimation hands back a no-op cancel when the flag is
      // already set, so a leaked flag would leave the demo permanently
      // unstartable *and* uncancellable. Clear it before playing.
      animatingRef.current = false;
      cancelDemoRef.current = playBeforeAfterDemoAnimation(
        setReveal,
        animatingRef,
        () => {
          cancelDemoRef.current = null;
        },
      );
    };

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          stopTick();
          cancelInFlightDemo();
          return;
        }

        // Only replay-keyed instances (the standalone hero preview swapping
        // images per selection) demo immediately on entry/key change; grid
        // cards swipe exclusively on the shared page clock so every row
        // stays in unison.
        if (demoReplayKey !== undefined) runDemo();
        scheduleAlignedTick();
      },
      { threshold: 0.35 },
    );

    obs.observe(el);

    return () => {
      obs.disconnect();
      stopTick();
      cancelInFlightDemo();
    };
  }, [autoDemoIntervalMs, cancelInFlightDemo, demoReplayKey, setReveal]);

  // Project (px, py) onto the 135° gradient line. Exact projection keeps
  // the diagonal anchored to the cursor on non-square aspect ratios.
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCoarsePointer()) return;
    // Unconditional, so the cursor takes over even when pointerenter never
    // fired (scroll-under-cursor, pre-hydration) or a demo is mid-flight.
    pointerInsideRef.current = true;
    cancelInFlightDemo();
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const W = rect.width;
    const H = rect.height;
    if (W === 0 || H === 0) return;
    const reveal = ((px * W + py * H) / (W * W + H * H)) * 100;
    setReveal(reveal);
  };

  // Touch is filtered out on both: hybrid laptops report `pointer: fine` yet
  // still emit compatibility mouse events on tap, and letting those through
  // would park the demo (enter with no matching leave) and stomp the
  // scroll-driven reveal (leave snapping back to 50). Pen genuinely hovers,
  // so filter on "touch" rather than on "not mouse".
  const onPointerEnter = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    pointerInsideRef.current = true;
    cancelInFlightDemo();
  };

  const onPointerLeave = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    pointerInsideRef.current = false;
    pointerLeftAtRef.current = performance.now();
    setReveal(DEFAULT_REVEAL);
  };

  return (
    <div
      ref={mediaRef}
      onMouseMove={onMouseMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={cn(
        "relative overflow-hidden before-after-media",
        className,
      )}
      style={{ "--reveal": DEFAULT_REVEAL } as CSSProperties}
    >
      {fallback && (
        <div className="absolute inset-0 flex items-center justify-center">
          {fallback}
        </div>
      )}
      {/*
        Reversed slider order (site-wide, per request): the "after"/result
        renders as the base layer and the "before"/original as the --reveal
        overlay, so the before/after wipe runs the opposite way on every
        slider. Alt text travels with its own image; the "Pre / posle" badge
        is side-agnostic so nothing is mislabeled.
      */}
      <Image
        src={afterSrc}
        alt={afterAlt}
        fill
        sizes={sizes}
        className="object-cover"
      />
      <Image
        src={beforeSrc}
        alt={beforeAlt}
        fill
        sizes={sizes}
        className="before-after-after-layer object-cover"
      />
      <div className="before-after-divider pointer-events-none absolute inset-0" />
      {children}
    </div>
  );
}
