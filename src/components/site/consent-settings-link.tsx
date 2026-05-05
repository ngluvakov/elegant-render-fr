/**
 * ConsentSettingsLink — Client-only button that re-opens the cookie
 * consent banner via the er-open-consent CustomEvent. Used in the
 * footer so the user can revisit/change their decision after the
 * initial banner has dismissed.
 */
"use client";

import { openConsentBanner } from "@/lib/consent";

export function ConsentSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openConsentBanner}
      className={className}
    >
      Podešavanja kolačića
    </button>
  );
}
