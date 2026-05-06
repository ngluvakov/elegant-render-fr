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

const rawMeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() ?? "";
const measurementId = /^G-[A-Z0-9]+$/.test(rawMeasurementId)
  ? rawMeasurementId
  : "";
const ga4Enabled = process.env.NEXT_PUBLIC_GA4_ENABLED === "true";

function setGaDisabled(disabled: boolean) {
  if (!measurementId || typeof window === "undefined") return;
  (window as unknown as Record<string, boolean>)[`ga-disable-${measurementId}`] =
    disabled;
}

function hasAnalyticsConsent(prefs: ConsentPrefs | null) {
  return Boolean(prefs?.analytics);
}

export function GoogleAnalyticsPostLaunch() {
  const pathname = usePathname();
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    const applyConsent = (prefs: ConsentPrefs | null) => {
      const allowed = hasAnalyticsConsent(prefs);
      setAnalyticsConsent(allowed);
      setGaDisabled(!allowed);
      if (window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: allowed ? "granted" : "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
      }
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
    if (!ga4Enabled || !measurementId || !analyticsConsent || !scriptReady) {
      return;
    }
    window.gtag?.("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [analyticsConsent, pathname, scriptReady]);

  if (!ga4Enabled || !measurementId || !analyticsConsent) return null;

  return (
    <>
      <Script
        id="ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            send_page_view: false,
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
}
