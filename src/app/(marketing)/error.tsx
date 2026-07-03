"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-2xl text-foreground">Nešto nije u redu</h2>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Došlo je do greške pri učitavanju stranice. Pokušajte ponovo — a ako
        se greška ponavlja, tu smo na{" "}
        <a className="underline" href="mailto:info@elegantrender.rs">
          info@elegantrender.rs
        </a>
        .
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Pokušaj ponovo</Button>
        <ButtonLink href="/" variant="outline">
          Nazad na početnu
        </ButtonLink>
      </div>
    </div>
  );
}
