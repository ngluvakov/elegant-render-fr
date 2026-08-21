/**
 * BeforeAfterSlider — the international-brand before/after comparison
 * slider per the White Rook design handoff (docs/design-handoff/CLAUDE.md
 * non-negotiables + Components.dc.html §05).
 *
 * Behavior spec:
 *  - An invisible `<input type="range">` overlay drives the reveal (clip)
 *    width, so pointer-drag and keyboard both work; values clamp 2–98%.
 *  - On viewport entry: one demo swipe 50 → 100 (700ms) → 0 (900ms) → 50
 *    (500ms), ease-in-out quad. Runs once per mount.
 *  - After the demo, the 135° diagonal tracks the cursor (exact projection,
 *    no lag); mouse leave returns to 50.
 *  - Pointer input always beats the demo: entering the image cancels a demo
 *    in flight, and the demo never starts under the cursor. See the contract
 *    in `before-after-demo-animation.ts`.
 *  - Touch / coarse pointers: demo on entry, then scroll-driven reveal.
 *  - `prefers-reduced-motion: reduce`: static 50/50 split, no demo.
 *  - 2px white divider along the diagonal; JetBrains Mono AVANT / APRÈS
 *    chips in rgba(10,10,10,0.55).
 *
 * Drives the `--reveal` CSS custom property directly on the DOM (no React
 * state per frame). Mask plumbing lives in `src/app/globals.css` under
 * `.before-after-media` / `.before-after-after-layer`.
 *
 * Used by: nothing at present — `before-after-showcase.tsx` wraps it, but that
 * wrapper has no importers either. The shipping slider is
 * `before-after-reveal.tsx`.
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

const REST_REVEAL = 50;
const POINTER_MIN = 2;
const POINTER_MAX = 98;
const DEMO_VIEWPORT_THRESHOLD = 0.35;

type Props = {
  beforeSrc: string;
  afterSrc: string;
  /** Base alt text; used to derive before/after alts when not provided. */
  alt: string;
  beforeAlt?: string;
  afterAlt?: string;
  /** Sizes hint for next/image. Defaults to a full-width section image. */
  sizes?: string;
  /** Classes for the outer media div — caller controls aspect ratio and bg. */
  className?: string;
  /** Hide the mono AVANT / APRÈS chips (e.g. when the caller renders its own). */
  hideLabels?: boolean;
  /** Rendered above the divider (extra badges etc.). */
  children?: ReactNode;
};

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  alt,
  beforeAlt = `Avant : ${alt}`,
  afterAlt = `Après : ${alt}`,
  sizes = "(max-width: 768px) 100vw, 1200px",
  className,
  hideLabels = false,
  children,
}: Props) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const animatingRef = useRef(false);
  const demoPlayedRef = useRef(false);
  const cancelDemoRef = useRef<(() => void) | null>(null);
  const pointerInsideRef = useRef(false);
  const coarsePointerRef = useRef<boolean | null>(null);

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

  const setReveal = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    const el = mediaRef.current;
    if (el) el.style.setProperty("--reveal", String(clamped));
    // Keep the invisible range input in sync so keyboard users continue
    // from the current position (no React state per frame).
    const range = rangeRef.current;
    if (range) {
      range.value = String(
        Math.round(Math.max(POINTER_MIN, Math.min(POINTER_MAX, clamped))),
      );
    }
  }, []);

  // Coarse pointers: demo on viewport entry, then scroll-driven reveal.
  // Also handles the reduced-motion static 50 for coarse pointers.
  useMobileBeforeAfterScrollReveal({
    mediaRef,
    animatingRef,
    setReveal,
  });

  // Fine pointers: one demo swipe on viewport entry (50→100→0→50).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      setReveal(REST_REVEAL);
      return;
    }

    const isCoarse = window.matchMedia(
      "(hover: none), (pointer: coarse)",
    ).matches;
    if (isCoarse) return;

    const el = mediaRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || demoPlayedRef.current) return;
        // Hover always wins — never open the demo under the cursor.
        // `matches(":hover")` catches what pointerenter cannot: the image
        // scrolling under a stationary cursor, and the pre-hydration window.
        if (pointerInsideRef.current || el.matches(":hover")) return;
        demoPlayedRef.current = true;
        obs.disconnect();
        cancelInFlightDemo();
        // A leaked flag would make the demo unstartable and uncancellable —
        // playBeforeAfterDemoAnimation returns a no-op cancel in that case.
        animatingRef.current = false;
        cancelDemoRef.current = playBeforeAfterDemoAnimation(
          setReveal,
          animatingRef,
          () => {
            cancelDemoRef.current = null;
          },
        );
      },
      { threshold: DEMO_VIEWPORT_THRESHOLD },
    );
    obs.observe(el);

    return () => {
      obs.disconnect();
      cancelInFlightDemo();
    };
  }, [cancelInFlightDemo, setReveal]);

  const clampPointer = (value: number) =>
    Math.max(POINTER_MIN, Math.min(POINTER_MAX, value));

  // Project (px, py) onto the 135° gradient axis — exact projection keeps
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
    setReveal(clampPointer(reveal));
  };

  // Touch is filtered out on both: hybrid laptops report `pointer: fine` yet
  // still emit compatibility mouse events on tap, and letting those through
  // would park the demo (enter with no matching leave) and stomp the
  // scroll-driven reveal (leave snapping back to rest). Pen genuinely hovers,
  // so filter on "touch" rather than on "not mouse".
  const onPointerEnter = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    pointerInsideRef.current = true;
    cancelInFlightDemo();
  };

  const onPointerLeave = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    pointerInsideRef.current = false;
    setReveal(REST_REVEAL);
  };

  const onRangeInput = (e: React.FormEvent<HTMLInputElement>) => {
    // Drag and keyboard are user input too — they outrank the demo. Don't
    // touch pointerInsideRef here: keyboard drives this with the cursor
    // elsewhere, and there is no pointerleave to clear the flag afterwards.
    cancelInFlightDemo();
    setReveal(clampPointer(Number(e.currentTarget.value)));
  };

  return (
    <div
      ref={mediaRef}
      onMouseMove={onMouseMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={cn(
        "before-after-media relative cursor-crosshair select-none overflow-hidden bg-[#0a0a0a]",
        className,
      )}
      style={{ "--reveal": REST_REVEAL } as CSSProperties}
    >
      {/* Base layer: AFTER. Overlay masked along the 135° diagonal: BEFORE. */}
      <Image
        src={afterSrc}
        alt={afterAlt}
        fill
        sizes={sizes}
        className="object-cover"
        draggable={false}
      />
      <Image
        src={beforeSrc}
        alt={beforeAlt}
        fill
        sizes={sizes}
        className="before-after-after-layer object-cover"
        draggable={false}
      />
      {/* 2px white divider tracking the 135° diagonal. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(135deg, transparent calc(var(--reveal) * 1% - 1px), #ffffff calc(var(--reveal) * 1% - 1px), #ffffff calc(var(--reveal) * 1% + 1px), transparent calc(var(--reveal) * 1% + 1px))",
        }}
      />
      {!hideLabels && (
        <>
          <span className="pointer-events-none absolute left-6 top-5 bg-[rgba(10,10,10,0.55)] px-2.5 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-white">
            Avant
          </span>
          <span className="pointer-events-none absolute bottom-5 right-6 bg-[rgba(10,10,10,0.55)] px-2.5 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-white">
            Après
          </span>
        </>
      )}
      {children}
      {/* Invisible range input: pointer-drag + keyboard driver, clamps 2–98. */}
      <input
        ref={rangeRef}
        type="range"
        min={POINTER_MIN}
        max={POINTER_MAX}
        defaultValue={REST_REVEAL}
        onInput={onRangeInput}
        aria-label="Comparer l’avant et l’après"
        className="absolute inset-0 h-full w-full cursor-crosshair opacity-0 [@media(hover:none)]:pointer-events-none"
      />
    </div>
  );
}
