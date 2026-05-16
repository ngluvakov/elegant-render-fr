"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import {
  CONSENT_CHANGE_EVENT,
  readConsent,
  type ConsentPrefs,
} from "@/lib/consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const rawContainerId = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID?.trim() ?? "";
const containerId = /^GTM-[A-Z0-9]+$/.test(rawContainerId)
  ? rawContainerId
  : "";
const gtmEnabled = process.env.NEXT_PUBLIC_GTM_ENABLED === "true";

function ensureGoogleDataLayer() {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    ((...args: unknown[]) => {
      window.dataLayer?.push(args);
    });
}

function updateGoogleConsent(allowed: boolean) {
  if (typeof window === "undefined") return;
  ensureGoogleDataLayer();
  window.gtag?.("consent", "update", {
    analytics_storage: allowed ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.dataLayer?.push({
    event: allowed
      ? "er_analytics_consent_granted"
      : "er_analytics_consent_denied",
    analytics_storage: allowed ? "granted" : "denied",
  });
}

function hasAnalyticsConsent(prefs: ConsentPrefs | null) {
  return Boolean(prefs?.analytics);
}

export function GoogleTagManagerPostLaunch() {
  const pathname = usePathname();
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    const applyConsent = (prefs: ConsentPrefs | null) => {
      const allowed = hasAnalyticsConsent(prefs);
      setAnalyticsConsent(allowed);
      updateGoogleConsent(allowed);
    };

    applyConsent(readConsent());

    const onConsentChange = (event: Event) => {
      const next =
        (event as CustomEvent<ConsentPrefs>).detail ?? readConsent();
      applyConsent(next);
    };

    window.addEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
    return () => {
      window.removeEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
    };
  }, []);

  useEffect(() => {
    if (!gtmEnabled || !containerId || !analyticsConsent || !scriptReady) {
      return;
    }
    window.dataLayer?.push({
      event: "virtual_page_view",
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [analyticsConsent, pathname, scriptReady]);

  if (!gtmEnabled || !containerId || !analyticsConsent) return null;

  return (
    <>
      <Script id="gtm-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
          window.dataLayer.push({
            'gtm.start': new Date().getTime(),
            event: 'gtm.js'
          });
        `}
      </Script>
      <Script
        id="gtm-loader"
        src={`https://www.googletagmanager.com/gtm.js?id=${containerId}`}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
    </>
  );
}
