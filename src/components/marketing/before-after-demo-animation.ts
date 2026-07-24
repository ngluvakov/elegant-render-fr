/**
 * Shared demo-swipe engine for every before/after slider (50→100→0→50 over a
 * 135° diagonal, driving the `--reveal` custom property).
 *
 * BINDING RULE for anything that calls this — user pointer input ALWAYS beats
 * the demo swipe. A visitor inspecting the image must never have it animate
 * out from under them.
 *
 *  - Never write `if (animatingRef.current) return;` in a pointer handler.
 *    That gives the demo priority and is exactly the bug this rule exists to
 *    prevent. Cancel the demo instead, then act on the pointer.
 *  - Gate the demo at its start — `if (pointerInsideRef.current ||
 *    el.matches(":hover")) return;`. The `:hover` half is load-bearing: it
 *    covers the element scrolling under a stationary cursor and the
 *    pre-hydration window, where no pointerenter ever fires.
 *  - Keep the repeat timer running and gate each tick. Do NOT stop/restart the
 *    timer on enter/leave — that adds a "paused and never resumed" failure mode
 *    and removes the only recovery from a stuck `:hover` on hybrid laptops.
 *  - Hover handlers go through onPointerEnter/onPointerLeave with an
 *    `e.pointerType === "touch"` bail (see portfolio-gallery.tsx). Filter on
 *    "touch", not on "not mouse" — a pen genuinely hovers.
 *  - Coarse pointers keep the scroll-driven path in
 *    `use-mobile-before-after-scroll-reveal.ts`; leave it alone.
 *
 * Cancelling mid-flight deliberately leaves `--reveal` where it stopped — the
 * 180ms transition on `.before-after-media` makes the handoff to the cursor
 * read as intentional. Note `playBeforeAfterDemoAnimation` returns a no-op
 * cancel when `animatingRef` is already true, so clear that flag before
 * starting a demo or a leaked flag wedges the slider permanently.
 */
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
