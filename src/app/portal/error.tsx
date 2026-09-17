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
      <h2 className="text-2xl text-foreground">Une erreur est survenue</h2>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Une erreur s’est produite lors du chargement de cette page. Vos données
        et vos commandes sont en sécurité. Réessayez, et si le problème
        persiste, écrivez-nous à{" "}
        <a className="underline" href="mailto:info@elegantrender.com">
          info@elegantrender.com
        </a>
        .
      </p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
