"use client";

import { useEffect, useRef } from "react";
import { CONSENT_CHANGE_EVENT } from "@/lib/consent";
import { pushGoogleDataLayerEvent } from "@/lib/analytics/google-data-layer-client";
import type { GoogleDataLayerEvent } from "@/lib/analytics/google-data-layer";

type DataLayerEventProps = {
  event: GoogleDataLayerEvent;
  onceKey?: string;
  requireMarketingConsent?: boolean;
};

export function DataLayerEvent({
  event,
  onceKey,
  requireMarketingConsent = true,
}: DataLayerEventProps) {
  const pushedRef = useRef(false);

  useEffect(() => {
    const tryPush = () => {
      if (pushedRef.current) return;
      pushedRef.current = pushGoogleDataLayerEvent(event, {
        onceKey,
        requireMarketingConsent,
      });
    };

    tryPush();
    if (pushedRef.current || !requireMarketingConsent) return;

    window.addEventListener(CONSENT_CHANGE_EVENT, tryPush);
    return () => {
      window.removeEventListener(CONSENT_CHANGE_EVENT, tryPush);
    };
  }, [event, onceKey, requireMarketingConsent]);

  return null;
}
