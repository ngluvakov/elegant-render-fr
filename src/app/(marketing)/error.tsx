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
      <h2 className="text-2xl text-foreground">Une erreur est survenue</h2>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Le chargement de cette page a échoué. Réessayez — et si l’erreur
        persiste, écrivez-nous à{" "}
        <a className="underline" href="mailto:info@elegantrender.fr">
          info@elegantrender.fr
        </a>
        .
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Réessayer</Button>
        <ButtonLink href="/" variant="outline">
          Retour à l’accueil
        </ButtonLink>
      </div>
    </div>
  );
}
