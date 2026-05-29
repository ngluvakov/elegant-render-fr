"use client";

/**
 * TurnstileWidget — lightweight wrapper around Cloudflare Turnstile.
 *
 * Loads the explicit-render API once globally, renders one widget per
 * mount, and pipes the resulting token back via `onVerify`. Renders
 * nothing when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset (local dev) —
 * the server-side `verifyTurnstile` helper short-circuits to ok=true
 * in that case so the flow remains usable.
 *
 * Used by: checkout step-payment for NestPay card payment initiation.
 */

import { useEffect, useRef } from "react";

const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileGlobal = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
      size?: "normal" | "compact";
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileGlobal;
  }
}

function loadTurnstileScript(): Promise<TurnstileGlobal> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Turnstile not available on server"));
      return;
    }
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.turnstile) resolve(window.turnstile);
        else reject(new Error("Turnstile script loaded but global missing"));
      });
      return;
    }
    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile global missing after load"));
    };
    script.onerror = () => reject(new Error("Failed to load Turnstile script"));
    document.head.appendChild(script);
  });
}

export type TurnstileWidgetProps = {
  onVerify: (token: string | null) => void;
};

export function TurnstileWidget({ onVerify }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;
    const container = containerRef.current;
    loadTurnstileScript()
      .then((turnstile) => {
        if (cancelled || !container.isConnected) return;
        widgetIdRef.current = turnstile.render(container, {
          sitekey: siteKey,
          callback: (token) => onVerify(token),
          "error-callback": () => onVerify(null),
          "expired-callback": () => onVerify(null),
          theme: "light",
        });
      })
      .catch(() => onVerify(null));

    return () => {
      cancelled = true;
      const turnstile = window.turnstile;
      if (turnstile && widgetIdRef.current) {
        try {
          turnstile.remove(widgetIdRef.current);
        } catch {
          /* widget may have been removed by React already */
        }
      }
    };
  }, [siteKey, onVerify]);

  if (!siteKey) return null;
  return <div ref={containerRef} className="cf-turnstile" />;
}
