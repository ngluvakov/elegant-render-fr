"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function PortalError({
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
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-2xl text-foreground">Nešto nije u redu</h2>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Došlo je do greške pri učitavanju ove stranice. Vaši podaci i
        porudžbine su bezbedni — pokušajte ponovo, a ako se greška ponavlja,
        pišite nam na{" "}
        <a className="underline" href="mailto:info@elegantrender.rs">
          info@elegantrender.rs
        </a>
        .
      </p>
      <Button onClick={reset}>Pokušaj ponovo</Button>
    </div>
  );
}
