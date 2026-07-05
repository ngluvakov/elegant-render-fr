/**
 * CompanyVatVerifier — debounced inline VIES check for the
 * company_foreign branch of step-review. Calls the public action
 * 800ms after the customer stops typing, surfaces a tone-bucketed
 * one-line result.
 *
 * Doesn't block submission — VIES outages happen, and admin
 * re-verifies before issuing the predračun (#102). The badge here
 * is a UX nicety that catches typos early.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, ShieldAlert } from "lucide-react";
import {
  checkPublicVat,
  type PublicVatCheckResult,
} from "@/server/actions/check-public-vat";

const DEBOUNCE_MS = 800;

type CachedResult = { key: string; result: PublicVatCheckResult };

export function CompanyVatVerifier({
  countryCode,
  vatNumber,
}: {
  countryCode: string;
  vatNumber: string;
}) {
  // Validity derived synchronously so the effect can early-return
  // without touching state. VAT IDs are never shorter than 4 chars
  // (smallest format is 2-letter country + 2-digit body); realistic
  // minimum after country stripping is around 5–6.
  const ready = useMemo(() => {
    const country = countryCode.trim();
    const number = vatNumber.trim();
    return country.length === 2 && number.length >= 4
      ? { country, number, key: `${country}:${number}` }
      : null;
  }, [countryCode, vatNumber]);

  // Cache the latest result keyed by the inputs that produced it. The
  // "checking" UI is derived: ready set + cached result's key doesn't
  // match the current input key. State is only mutated from inside
  // async callbacks (set-state-in-effect lint rule).
  const [cached, setCached] = useState<CachedResult | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (cached?.key === ready.key) return;

    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const result = await checkPublicVat({
          countryCode: ready.country,
          vatNumber: ready.number,
        });
        if (!cancelled) {
          setCached({ key: ready.key, result });
        }
      } catch {
        if (!cancelled) {
          setCached({
            key: ready.key,
            result: {
              status: "error",
              message: "Greška mreže — admin će proveriti ručno.",
            },
          });
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [ready, cached]);

  if (!ready) return null;

  const result = cached?.key === ready.key ? cached.result : null;
  if (!result) {
    return (
      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[0.72rem] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Proveravam VAT preko VIES-a…
      </p>
    );
  }

  if (result.status === "valid") {
    return (
      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[0.72rem] text-[color:var(--color-sage-deep)]">
        <CheckCircle2 className="h-3 w-3" />
        VIES potvrdio VAT
        {result.verifiedName ? (
          <span className="text-muted-foreground">
            {" "}
            · {result.verifiedName}
          </span>
        ) : null}
      </p>
    );
  }

  if (result.status === "invalid") {
    return (
      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[0.72rem] text-destructive">
        <ShieldAlert className="h-3 w-3" />
        VIES kaže: VAT ID nije važeći. Možete nastaviti i tim će
        proveriti, ili ispravite ako je tipfeler.
      </p>
    );
  }

  if (result.status === "unsupported_country") {
    return (
      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[0.72rem] text-muted-foreground">
        <AlertCircle className="h-3 w-3" />
        Zemlja nije u EU — VIES provera nije primenljiva.
      </p>
    );
  }

  if (result.status === "rate_limited") {
    return (
      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[0.72rem] text-muted-foreground">
        <AlertCircle className="h-3 w-3" />
        {result.message}
      </p>
    );
  }

  // status === "error"
  return (
    <p className="mt-1.5 inline-flex items-center gap-1.5 text-[0.72rem] text-muted-foreground">
      <AlertCircle className="h-3 w-3" />
      VIES nije dostupan trenutno — tim će ručno proveriti.
    </p>
  );
}
