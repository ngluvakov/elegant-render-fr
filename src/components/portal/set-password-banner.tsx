/**
 * SetPasswordBanner — Soft prompt for guest-checkout users to set a
 * password. Renders only when the user has none on their account.
 *
 * Used on: portal layout shell (visible across all /portal/* pages).
 */
import Link from "next/link";
import { KeyRound } from "lucide-react";

export function SetPasswordBanner() {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15">
          <KeyRound className="h-4 w-4 text-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Postavite lozinku za brži pristup
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ubuduće ćete moći da se prijavite direktno, bez čekanja na
            link iz email-a. Magic link i dalje radi ako preskočite.
          </p>
        </div>
      </div>
      <Link
        href="/portal/profile#password"
        className="inline-flex shrink-0 items-center justify-center rounded-lg border border-accent/40 bg-background px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10"
      >
        Postavi lozinku
      </Link>
    </div>
  );
}
