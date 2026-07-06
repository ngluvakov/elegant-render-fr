"use client";

import { readConsent } from "@/lib/consent";
import type { GoogleDataLayerEvent } from "@/lib/analytics/google-data-layer";

type PushOptions = {
  onceKey?: string;
  requireMarketingConsent?: boolean;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function hasMarketingConsent(): boolean {
  return Boolean(readConsent()?.marketing);
}

function defaultOnceKey(event: GoogleDataLayerEvent): string | undefined {
  if (event.event === "purchase") {
    return `${event.event}:${event.transaction_id}`;
  }
  return event.event_id ? `${event.event}:${event.event_id}` : undefined;
}

function markOnce(key: string): boolean {
  try {
    const storageKey = `er:data-layer:${key}`;
    if (window.sessionStorage.getItem(storageKey)) return false;
    window.sessionStorage.setItem(storageKey, "1");
    return true;
  } catch {
    return true;
  }
}

export function pushGoogleDataLayerEvent(
  event: GoogleDataLayerEvent,
  options: PushOptions = {},
): boolean {
  if (typeof window === "undefined") return false;
  const requireMarketingConsent = options.requireMarketingConsent ?? true;
  if (requireMarketingConsent && !hasMarketingConsent()) return false;

  const onceKey = options.onceKey ?? defaultOnceKey(event);
  if (onceKey && !markOnce(onceKey)) return false;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    ...event,
    source_path: event.source_path ?? window.location.pathname,
  });
  return true;
}
