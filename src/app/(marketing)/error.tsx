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
      <h2 className="text-2xl text-foreground">Something went wrong</h2>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        An error occurred while loading this page. Try again — and if the
        error keeps happening, reach us at{" "}
        <a className="underline" href="mailto:info@elegantrender.com">
          info@elegantrender.com
        </a>
        .
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="outline">
          Back to the homepage
        </ButtonLink>
      </div>
    </div>
  );
}
