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
      <h2 className="text-2xl text-foreground">Something went wrong</h2>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        There was an error loading this page. Your data and orders are safe.
        Try again, and if the issue keeps happening, write to us at{" "}
        <a className="underline" href="mailto:info@elegantrender.com">
          info@elegantrender.com
        </a>
        .
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
