"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  CONSENT_CHANGE_EVENT,
  readConsent,
  type ConsentPrefs,
} from "@/lib/consent";

declare global {
  interface Window {
    _linkedin_partner_id?: string;
    _linkedin_data_partner_ids?: string[];
    lintrk?: ((action: string, payload?: unknown) => void) & {
      q?: [string, unknown?][];
    };
  }
}

const LINKEDIN_PARTNER_ID = "9178042";
const LINKEDIN_INSIGHT_SCRIPT_ID = "linkedin-insight-library";

const LINKEDIN_INSIGHT_BOOTSTRAP = `
(function() {
  var partnerId = "${LINKEDIN_PARTNER_ID}";
  window._linkedin_partner_id = partnerId;
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  if (window._linkedin_data_partner_ids.indexOf(partnerId) === -1) {
    window._linkedin_data_partner_ids.push(partnerId);
  }
  (function(l) {
    if (!l) {
      window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
      window.lintrk.q = [];
    }
    if (document.getElementById("${LINKEDIN_INSIGHT_SCRIPT_ID}")) {
      return;
    }
    var s = document.getElementsByTagName("script")[0];
    var b = document.createElement("script");
    b.id = "${LINKEDIN_INSIGHT_SCRIPT_ID}";
    b.type = "text/javascript";
    b.async = true;
    b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
    s.parentNode.insertBefore(b, s);
  })(window.lintrk);
})();
`;

function hasMarketingConsent(prefs: ConsentPrefs | null) {
  return Boolean(prefs?.marketing);
}

export function LinkedInInsightTag() {
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    const applyConsent = (prefs: ConsentPrefs | null) => {
      setMarketingConsent(hasMarketingConsent(prefs));
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

  if (!marketingConsent) return null;

  // No noscript pixel: consent lives in localStorage, so a server-rendered
  // fallback would fire without being able to honor the marketing choice.
  return (
    <Script id="linkedin-insight-tag" strategy="afterInteractive">
      {LINKEDIN_INSIGHT_BOOTSTRAP}
    </Script>
  );
}
