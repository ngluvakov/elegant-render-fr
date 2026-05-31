"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import {
  CONSENT_CHANGE_EVENT,
  readConsent,
  type ConsentPrefs,
} from "@/lib/consent";

const GTM_ENABLED = process.env.NEXT_PUBLIC_GTM_ENABLED === "true";
const GTM_CONTAINER_ID =
  process.env.NEXT_PUBLIC_GTM_CONTAINER_ID?.trim() || "GTM-5X2MCQ87";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __erGoogleConsentDefaultSet?: boolean;
  }
}

function ensureGoogleDataLayer() {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    ((...args: unknown[]) => {
      window.dataLayer?.push(args);
    });
  if (!window.__erGoogleConsentDefaultSet) {
    window.__erGoogleConsentDefaultSet = true;
    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }
}

function googleTagManagerBootstrap(containerId: string) {
  return `
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({'gtm.start': new Date().getTime(), event:'gtm.js'});
(function(w,d,s,l,i){w[l]=w[l]||[];var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');
`;
}

function updateGoogleConsent(analyticsAllowed: boolean, marketingAllowed: boolean) {
  if (typeof window === "undefined") return;
  ensureGoogleDataLayer();
  window.gtag?.("consent", "update", {
    analytics_storage: analyticsAllowed ? "granted" : "denied",
    ad_storage: marketingAllowed ? "granted" : "denied",
    ad_user_data: marketingAllowed ? "granted" : "denied",
    ad_personalization: marketingAllowed ? "granted" : "denied",
  });
  window.dataLayer?.push({
    event: analyticsAllowed
      ? "er_analytics_consent_granted"
      : "er_analytics_consent_denied",
    analytics_storage: analyticsAllowed ? "granted" : "denied",
    ad_storage: marketingAllowed ? "granted" : "denied",
    ad_user_data: marketingAllowed ? "granted" : "denied",
    ad_personalization: marketingAllowed ? "granted" : "denied",
  });
}

function hasAnalyticsConsent(prefs: ConsentPrefs | null) {
  return Boolean(prefs?.analytics);
}

function hasMarketingConsent(prefs: ConsentPrefs | null) {
  return Boolean(prefs?.marketing);
}

export function GoogleTagManagerPostLaunch() {
  const pathname = usePathname();
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    const applyConsent = (prefs: ConsentPrefs | null) => {
      const analyticsAllowed = hasAnalyticsConsent(prefs);
      const marketingAllowed = hasMarketingConsent(prefs);
      setAnalyticsConsent(analyticsAllowed);
      setMarketingConsent(marketingAllowed);
      updateGoogleConsent(analyticsAllowed, marketingAllowed);
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
    if (!analyticsConsent) {
      return;
    }
    window.dataLayer?.push({
      event: "virtual_page_view",
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [analyticsConsent, pathname]);

  if (!GTM_ENABLED || (!analyticsConsent && !marketingConsent)) {
    return null;
  }

  return (
    <Script id="google-tag-manager" strategy="afterInteractive">
      {googleTagManagerBootstrap(GTM_CONTAINER_ID)}
    </Script>
  );
}
