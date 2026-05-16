/**
 * BeforeAfterReveal — diagonal before/after image reveal that tracks the
 * mouse on desktop and demos itself once in viewport on coarse pointers.
 *
 * Drives the `--reveal` CSS custom property directly on the DOM (no React
 * state per frame) so mouse-move stays cheap. Styling lives in
 * `src/app/globals.css` under `.before-after-media`, `.before-after-after-layer`,
 * `.before-after-divider`, with `@property --reveal` registered for smooth
 * transitions.
 *
 * Used by: tool-picker-card (AI Studio tool picker), quick-order-hero
 * ("Minimalni ulaz" preview for Virtuelno opremanje).
 */
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const DEFAULT_REVEAL = 50;
const DEMO_VIEWPORT_THRESHOLD = 0.4;

type Props = {
  beforeSrc: string;
  afterSrc: string;
  alt: string;
  /** Sizes hint for next/image. Defaults to a mid-page card. */
  sizes?: string;
  /** Classes for the outer media div — caller controls aspect ratio, radius, bg. */
  className?: string;
  /** Rendered behind the images (e.g. loader icon). */
  fallback?: ReactNode;
  /** Rendered above the divider (e.g. "Pre / posle" badge). */
  children?: ReactNode;
};

export function BeforeAfterReveal({
  beforeSrc,
  afterSrc,
  alt,
  sizes = "(max-width: 768px) 100vw, 55vw",
  className,
  fallback,
  children,
}: Props) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);

  const setReveal = (value: number) => {
    const el = mediaRef.current;
    if (!el) return;
    el.style.setProperty(
      "--reveal",
      String(Math.max(0, Math.min(100, value))),
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    const isCoarse = window.matchMedia("(hover: none)").matches;
    if (!isCoarse) return;

    const el = mediaRef.current;
    if (!el) return;

    let played = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          played = false;
          return;
        }
        if (played) return;
        played = true;
        playDemoAnimation(setReveal, animatingRef);
      },
      { threshold: DEMO_VIEWPORT_THRESHOLD },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Project (px, py) onto the 135° gradient line. Exact projection keeps
  // the diagonal anchored to the cursor on non-square aspect ratios.
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (animatingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const W = rect.width;
    const H = rect.height;
    if (W === 0 || H === 0) return;
    const reveal = ((px * W + py * H) / (W * W + H * H)) * 100;
    setReveal(reveal);
  };

  const onMouseLeave = () => {
    if (animatingRef.current) return;
    setReveal(DEFAULT_REVEAL);
  };

  return (
    <div
      ref={mediaRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
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
      <Image
        src={beforeSrc}
        alt=""
        fill
        sizes={sizes}
        className="object-cover"
      />
      <Image
        src={afterSrc}
        alt={alt}
        fill
        sizes={sizes}
        className="before-after-after-layer object-cover"
      />
      <div className="before-after-divider pointer-events-none absolute inset-0" />
      {children}
    </div>
  );
}

// ─── Demo animation (mobile / coarse pointer first-view) ─────────────────

type DemoSegment = { from: number; to: number; durationMs: number };

const DEMO_SEGMENTS: readonly DemoSegment[] = [
  { from: 50, to: 100, durationMs: 700 },
  { from: 100, to: 0, durationMs: 900 },
  { from: 0, to: 50, durationMs: 500 },
];

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

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
