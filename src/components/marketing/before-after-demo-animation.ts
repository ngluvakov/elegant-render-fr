"use client";

import type { MutableRefObject } from "react";

type DemoSegment = { from: number; to: number; durationMs: number };

const DEMO_SEGMENTS: readonly DemoSegment[] = [
  { from: 50, to: 100, durationMs: 700 },
  { from: 100, to: 0, durationMs: 900 },
  { from: 0, to: 50, durationMs: 500 },
];

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function playBeforeAfterDemoAnimation(
  setReveal: (n: number) => void,
  animatingRef: MutableRefObject<boolean>,
  onDone: () => void = () => {},
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
