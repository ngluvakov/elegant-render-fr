"use client";

import { useEffect, type MutableRefObject, type RefObject } from "react";
import { playBeforeAfterDemoAnimation } from "@/components/marketing/before-after-demo-animation";

const REST_REVEAL = 50;
const MIN_SCROLL_REVEAL = 20;
const MAX_SCROLL_REVEAL = 100;
const DEMO_VIEWPORT_THRESHOLD = 0.4;
const SCROLL_START_VIEWPORT_RATIO = 0.9;
const SCROLL_COMPLETE_VIEWPORT_RATIO = 0.42;

type UseMobileBeforeAfterScrollRevealOptions = {
  mediaRef: RefObject<HTMLDivElement | null>;
  animatingRef: MutableRefObject<boolean>;
  setReveal: (value: number) => void;
  demoReplayKey?: string | number;
  demoIntervalMs?: number;
};

export function useMobileBeforeAfterScrollReveal({
  mediaRef,
  animatingRef,
  setReveal,
  demoReplayKey,
  demoIntervalMs,
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
    let intervalId: number | null = null;
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

    const stopInterval = () => {
      if (intervalId === null) return;
      window.clearInterval(intervalId);
      intervalId = null;
    };

    const runDemo = () => {
      scrollDriven = false;
      cancelDemo?.();
      cancelDemo = playBeforeAfterDemoAnimation(setReveal, animatingRef, () => {
        cancelDemo = null;
        scrollDriven = true;
        scheduleScrollReveal();
      });
    };

    const startInterval = () => {
      stopInterval();
      if (!demoIntervalMs) return;
      intervalId = window.setInterval(runDemo, demoIntervalMs);
    };

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          playedInView = false;
          scrollDriven = false;
          stopInterval();
          cancelDemo?.();
          cancelDemo = null;
          return;
        }

        if (playedInView) {
          scrollDriven = true;
          scheduleScrollReveal();
          startInterval();
          return;
        }

        playedInView = true;
        runDemo();
        startInterval();
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
      stopInterval();
      cancelDemo?.();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [animatingRef, demoIntervalMs, demoReplayKey, mediaRef, setReveal]);
}
