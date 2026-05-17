/**
 * BeforeAfterReveal — diagonal before/after image reveal that tracks the
 * mouse on desktop, then on coarse pointers demos itself on viewport entry
 * before switching to a scroll-driven reveal.
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

import { useCallback, useRef, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useMobileBeforeAfterScrollReveal } from "@/components/marketing/use-mobile-before-after-scroll-reveal";

const DEFAULT_REVEAL = 50;

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

  const setReveal = useCallback((value: number) => {
    const el = mediaRef.current;
    if (!el) return;
    el.style.setProperty(
      "--reveal",
      String(Math.max(0, Math.min(100, value))),
    );
  }, []);

  useMobileBeforeAfterScrollReveal({ mediaRef, animatingRef, setReveal });

  // Project (px, py) onto the 135° gradient line. Exact projection keeps
  // the diagonal anchored to the cursor on non-square aspect ratios.
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (animatingRef.current) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none), (pointer: coarse)").matches
    ) {
      return;
    }
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
