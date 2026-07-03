/**
 * Panorama360 — interactive equirectangular 360° viewer (drag to look around,
 * scroll/pinch to zoom, auto-rotate when idle, fullscreen).
 *
 * Uses the self-hosted Pannellum build in `public/vendor/pannellum/`
 * (no npm dependency, no runtime CDN). The library is loaded once, lazily,
 * the first time a viewer mounts — so it only ships on pages that use it.
 *
 * Used by: ProblemVisual (service detail page) when a service sets
 * `problemPanoramaSrc`.
 */
"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    pannellum?: {
      viewer: (
        container: HTMLElement | string,
        config: Record<string, unknown>,
      ) => { destroy: () => void };
    };
  }
}

let loadPromise: Promise<void> | null = null;

function loadPannellum(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.pannellum) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    if (!document.querySelector("link[data-pannellum]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/vendor/pannellum/pannellum.css";
      link.dataset.pannellum = "";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "/vendor/pannellum/pannellum.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Pannellum failed to load"));
    document.body.appendChild(script);
  });

  return loadPromise;
}

type Props = { src: string; title?: string; showZoomCtrl?: boolean };

export function Panorama360({ src, title, showZoomCtrl = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadPannellum()
      .then(() => {
        if (cancelled || !containerRef.current || !window.pannellum) return;
        viewerRef.current = window.pannellum.viewer(containerRef.current, {
          type: "equirectangular",
          panorama: src,
          autoLoad: true,
          autoRotate: -2,
          autoRotateInactivityDelay: 3000,
          showZoomCtrl,
          showFullscreenCtrl: false,
          mouseZoom: true,
          draggable: true,
          compass: false,
          hfov: 100,
          minHfov: 50,
          maxHfov: 120,
        });
      })
      .catch(() => {
        /* WebGL unsupported / load failed — Pannellum shows its own message. */
      });

    return () => {
      cancelled = true;
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch {
          /* noop */
        }
        viewerRef.current = null;
      }
    };
  }, [src, showZoomCtrl]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      role="img"
      aria-label={title ?? "Interaktivna 360° panorama"}
    />
  );
}
