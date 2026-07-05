/**
 * BeforeAfterShowcase — diagonal before/after reveal driven by viewport
 * entry (auto-animate 0→50% on first intersection) + hover (desktop).
 * On mobile / coarse pointers, it shares the demo-then-scroll reveal used
 * by the lighter before/after cards. Different UX intent from
 * `BeforeAfterReveal`: this is the showcase variant used on the /services
 * listing where the goal is "watch us transform this" rather than the
 * interactive mouse-tracked reveal used on the detail page and home picker.
 *
 * Reuses the same CSS plumbing as BeforeAfterReveal — `.before-after-media`,
 * `.before-after-after-layer`, `.before-after-divider`, `@property --reveal`
 * — only the driver of `--reveal` differs.
 *
 * Behavior:
 *  - On first viewport entry (IO threshold 0.3): animate 0 → 50% over 700ms.
 *  - Desktop (hover-capable pointer): on enter animate to 100% (400ms); on
 *    leave animate back to 50% (600ms). Ignored while the load animation
 *    is still running (the entry animation finishes first).
 *  - Mobile / coarse pointer: play the 50→100→0→50 demo on viewport entry,
 *    then drive `--reveal` from scroll position (20→100%).
 *  - `prefers-reduced-motion: reduce`: skip everything, hold at 50%.
 *
 * Used by: services-showcase (the /services listing page).
 */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useMobileBeforeAfterScrollReveal } from "@/components/marketing/use-mobile-before-after-scroll-reveal";

const REST_REVEAL = 50;
const LOAD_DURATION_MS = 700;
const HOVER_IN_DURATION_MS = 400;
const HOVER_OUT_DURATION_MS = 600;
const VIEWPORT_ENTRY_THRESHOLD = 0.3;

type Props = {
  beforeSrc: string;
  afterSrc: string;
  alt: string;
  beforeAlt?: string;
  afterAlt?: string;
  sizes?: string;
  className?: string;
  fallback?: ReactNode;
  children?: ReactNode;
};

export function BeforeAfterShowcase({
  beforeSrc,
  afterSrc,
  alt,
  beforeAlt = `Pre: ${alt}`,
  afterAlt = `Posle: ${alt}`,
  sizes = "(max-width: 768px) 100vw, 1200px",
  className,
  fallback,
  children,
}: Props) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const mobileAnimatingRef = useRef(false);
  const loadAnimationDoneRef = useRef(false);

  const setReveal = useCallback((value: number) => {
    const el = mediaRef.current;
    if (!el) return;
    el.style.setProperty(
      "--reveal",
      String(Math.max(0, Math.min(100, value))),
    );
  }, []);

  useMobileBeforeAfterScrollReveal({
    mediaRef,
    animatingRef: mobileAnimatingRef,
    setReveal,
  });

  const cancelAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const animateTo = useCallback(
    (target: number, durationMs: number, onDone?: () => void) => {
      cancelAnimation();
      const el = mediaRef.current;
      if (!el) return;
      const startValue = Number(
        getComputedStyle(el).getPropertyValue("--reveal").trim() || REST_REVEAL,
      );
      const startTime = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        setReveal(startValue + (target - startValue) * eased);
        if (t < 1) {
          animationRef.current = requestAnimationFrame(step);
        } else {
          animationRef.current = null;
          onDone?.();
        }
      };
      animationRef.current = requestAnimationFrame(step);
    },
    [cancelAnimation, setReveal],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = mediaRef.current;
    if (!el) return;

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

    // --- Desktop: auto-animate 0→50% on first viewport entry, then hover ---
    setReveal(0);
    let unobserved = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || unobserved) return;
        unobserved = true;
        obs.disconnect();
        animateTo(REST_REVEAL, LOAD_DURATION_MS, () => {
          loadAnimationDoneRef.current = true;
        });
      },
      { threshold: VIEWPORT_ENTRY_THRESHOLD },
    );
    obs.observe(el);

    return () => {
      obs.disconnect();
      cancelAnimation();
    };
  }, [animateTo, cancelAnimation, setReveal]);

  const onMouseEnter = () => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    if (!loadAnimationDoneRef.current) return;
    animateTo(100, HOVER_IN_DURATION_MS);
  };

  const onMouseLeave = () => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    if (!loadAnimationDoneRef.current) return;
    animateTo(REST_REVEAL, HOVER_OUT_DURATION_MS);
  };

  return (
    <div
      ref={mediaRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "relative overflow-hidden before-after-media",
        className,
      )}
      style={{ "--reveal": 0 } as CSSProperties}
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
