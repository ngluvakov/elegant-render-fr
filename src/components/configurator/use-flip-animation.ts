"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * FLIP (First-Last-Invert-Play) animation for reordered lists.
 *
 * Mark each animatable child with `data-flip-key="<stable-id>"`. After every
 * dep change, the hook measures current positions, compares them to the
 * positions captured during the previous render, and animates each child
 * from its old position to its new position using the Web Animations API.
 *
 * No new dependency; works in all modern browsers.
 */
export function useFlipAnimation(
  containerRef: RefObject<HTMLElement | null>,
  depKey: string,
  durationMs: number = 280,
) {
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>("[data-flip-key]");
    const nextRects = new Map<string, DOMRect>();

    items.forEach((el) => {
      const key = el.dataset.flipKey;
      if (!key) return;
      nextRects.set(key, el.getBoundingClientRect());
    });

    const prev = prevRectsRef.current;
    if (prev.size > 0) {
      items.forEach((el) => {
        const key = el.dataset.flipKey;
        if (!key) return;
        const oldRect = prev.get(key);
        const newRect = nextRects.get(key);
        if (!oldRect || !newRect) return;
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top - newRect.top;
        if (dx === 0 && dy === 0) return;
        el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: "translate(0, 0)" },
          ],
          { duration: durationMs, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
        );
      });
    }

    prevRectsRef.current = nextRects;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);
}
