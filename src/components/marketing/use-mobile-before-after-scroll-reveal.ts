"use client";

import { useEffect, type MutableRefObject, type RefObject } from "react";

const REST_REVEAL = 50;
const MIN_SCROLL_REVEAL = 20;
const MAX_SCROLL_REVEAL = 100;
const DEMO_VIEWPORT_THRESHOLD = 0.4;
const SCROLL_START_VIEWPORT_RATIO = 0.9;
const SCROLL_COMPLETE_VIEWPORT_RATIO = 0.42;

type DemoSegment = { from: number; to: number; durationMs: number };

const DEMO_SEGMENTS: readonly DemoSegment[] = [
  { from: 50, to: 100, durationMs: 700 },
  { from: 100, to: 0, durationMs: 900 },
  { from: 0, to: 50, durationMs: 500 },
];

type UseMobileBeforeAfterScrollRevealOptions = {
  mediaRef: RefObject<HTMLDivElement | null>;
  animatingRef: MutableRefObject<boolean>;
  setReveal: (value: number) => void;
};

export function useMobileBeforeAfterScrollReveal({
  mediaRef,
  animatingRef,
  setReveal,
}: UseMobileBeforeAfterScrollRevealOptions) {
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
    if (!isCoarse) return;

    const el = mediaRef.current;
    if (!el) return;

    setReveal(REST_REVEAL);

    let rafId: number | null = null;
    let cancelDemo: (() => void) | null = null;
    let playedInView = false;
    let scrollDriven = false;

    const revealFromViewportPosition = () => {
      if (!scrollDriven || animatingRef.current) {
        rafId = null;
        return;
      }

      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const imageCenterY = rect.top + rect.height / 2;
      const startY = viewportH * SCROLL_START_VIEWPORT_RATIO;
      const completeY = viewportH * SCROLL_COMPLETE_VIEWPORT_RATIO;
      const rawRatio = (startY - imageCenterY) / (startY - completeY);
      const ratio = Math.max(0, Math.min(1, rawRatio));

      setReveal(
        MIN_SCROLL_REVEAL +
          ratio * (MAX_SCROLL_REVEAL - MIN_SCROLL_REVEAL),
      );
      rafId = null;
    };

    const scheduleScrollReveal = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(revealFromViewportPosition);
    };

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          playedInView = false;
          scrollDriven = false;
          cancelDemo?.();
          cancelDemo = null;
          return;
        }

        if (playedInView) {
          scrollDriven = true;
          scheduleScrollReveal();
          return;
        }

        playedInView = true;
        scrollDriven = false;
        cancelDemo?.();
        cancelDemo = playDemoAnimation(setReveal, animatingRef, () => {
          cancelDemo = null;
          scrollDriven = true;
          scheduleScrollReveal();
        });
      },
      { threshold: DEMO_VIEWPORT_THRESHOLD },
    );

    obs.observe(el);
    window.addEventListener("scroll", scheduleScrollReveal, { passive: true });
    window.addEventListener("resize", scheduleScrollReveal, { passive: true });

    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", scheduleScrollReveal);
      window.removeEventListener("resize", scheduleScrollReveal);
      cancelDemo?.();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [animatingRef, mediaRef, setReveal]);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function playDemoAnimation(
  setReveal: (n: number) => void,
  animatingRef: MutableRefObject<boolean>,
  onDone: () => void,
): () => void {
  if (animatingRef.current) return () => {};
  animatingRef.current = true;

  let cancelled = false;
  let frameId: number | null = null;
  let segIdx = 0;
  let segStart = performance.now();

  const step = (now: number) => {
    if (cancelled) return;

    const seg = DEMO_SEGMENTS[segIdx];
    const elapsed = now - segStart;
    const t = Math.min(1, elapsed / seg.durationMs);
    setReveal(seg.from + (seg.to - seg.from) * easeInOutQuad(t));

    if (t < 1) {
      frameId = requestAnimationFrame(step);
      return;
    }

    segIdx++;
    if (segIdx < DEMO_SEGMENTS.length) {
      segStart = now;
      frameId = requestAnimationFrame(step);
      return;
    }

    animatingRef.current = false;
    frameId = null;
    onDone();
  };

  frameId = requestAnimationFrame(step);

  return () => {
    cancelled = true;
    if (frameId !== null) cancelAnimationFrame(frameId);
    animatingRef.current = false;
  };
}
