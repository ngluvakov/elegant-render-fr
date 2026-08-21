/**
 * BackToTop — a floating "scroll to top" button shown on every marketing
 * page. It stays hidden until the visitor scrolls down a screenful, then
 * fades in at the bottom-left (the chat FAB owns the bottom-right corner).
 * Clicking smooth-scrolls back to the top; respects reduced-motion.
 */
"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Retour en haut de page"
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-5 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition-all duration-200 hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-6 sm:left-6 sm:h-14 sm:w-14 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6" />
    </button>
  );
}
