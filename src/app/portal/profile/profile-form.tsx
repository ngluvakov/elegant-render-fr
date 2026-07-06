"use client";

import { useActionState, useMemo, useState } from "react";
import { Building2, Globe2, Pencil, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COUNTRIES } from "@/lib/iso-countries";
import { buyerTypeForBilling } from "@/lib/billing";
import type { BuyerType } from "@/lib/buyer-validation";
import {
  updateProfileAction,
  type ProfileState,
} from "@/server/actions/profile";

const initialState: ProfileState = {};

type ProfileFormProps = {
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
  hasPassword: boolean;
  defaultBilling: {
    buyerType: BuyerType;
    countryCode: string;
    companyName: string;
    companyTaxId: string;
    companyAddress: string;
  };
};

export function ProfileForm({
  defaultName,
  defaultEmail,
  defaultPhone,
  hasPassword,
  defaultBilling,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const [billingKind, setBillingKind] = useState<"individual" | "company">(
    defaultBilling.buyerType === "individual" ? "individual" : "company",
  );
  const [billingCountryCode, setBillingCountryCode] = useState(
    defaultBilling.countryCode || "RS",
  );

  const derivedBuyerType = useMemo(
    () => buyerTypeForBilling(billingKind, billingCountryCode),
    [billingKind, billingCountryCode],
  );
  const isCompany = billingKind === "company";
  const isSerbia = billingCountryCode === "RS";

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg border border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/10 px-4 py-3 text-sm text-[color:var(--color-sage-deep)]">
          Your details have been updated.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">
          <Pencil className="h-3 w-3 text-accent/60" />
          Full name
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultName}
          autoComplete="name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={defaultEmail}
          disabled
          className="opacity-60"
        />
        <p className="text-xs text-muted-foreground">
          The email address cannot be changed.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          <Pencil className="h-3 w-3 text-accent/60" />
          Phone
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultPhone}
          autoComplete="tel"
        />
      </div>

      <div id="password" className="space-y-2 scroll-mt-24">
        <Label htmlFor="newPassword">
          <Pencil className="h-3 w-3 text-accent/60" />
          {hasPassword ? "New password (optional)" : "Set a password"}
        </Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder={
            hasPassword ? "Leave blank if unchanged" : "At least 8 characters"
          }
        />
        {!hasPassword && (
          <p className="text-xs text-muted-foreground">
            Once set, you will be able to sign in directly without waiting for
            an email link.
          </p>
        )}
      </div>

      <section className="space-y-5 rounded-2xl border border-border/50 bg-card/60 p-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Billing details
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Used as the default for future orders and additional charges.
            Already issued invoices will not change.
          </p>
        </div>

        <input type="hidden" name="billingKind" value={billingKind} />
        <input
          type="hidden"
          name="billingBuyerType"
          value={derivedBuyerType}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setBillingKind("individual")}
            className={
              "flex items-start gap-3 rounded-xl border p-4 text-left transition " +
              (billingKind === "individual"
                ? "border-accent bg-accent/5"
                : "border-border bg-background/60 hover:bg-background")
            }
          >
            <UserRound className="mt-0.5 h-4 w-4 text-accent" />
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Individual
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                The invoice is issued to the account name.
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setBillingKind("company")}
            className={
              "flex items-start gap-3 rounded-xl border p-4 text-left transition " +
              (billingKind === "company"
                ? "border-accent bg-accent/5"
                : "border-border bg-background/60 hover:bg-background")
            }
          >
            <Building2 className="mt-0.5 h-4 w-4 text-accent" />
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Company
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                We save the details for invoices.
              </span>
            </span>
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground">
              Billing country <span className="ml-1 text-destructive">*</span>
            </span>
            <select
              name="billingCountryCode"
              value={billingCountryCode}
              onChange={(e) => setBillingCountryCode(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
              required
            >
              <option value="RS">Serbia (RS)</option>
              <option disabled>──────────</option>
              {COUNTRIES.map((country) =>
                country.code === "" ? (
                  <option key="separator" disabled>
                    {country.label}
                  </option>
                ) : (
                  <option key={country.code} value={country.code}>
                    {country.label} ({country.code})
                  </option>
                ),
              )}
            </select>
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/60 px-3 py-2 text-sm text-foreground">
            <Globe2 className="h-4 w-4 text-accent" />
            <span>Future invoices: EUR</span>
          </div>
        </div>

        {isCompany && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="billingCompanyName">Company name</Label>
              <Input
                id="billingCompanyName"
                name="billingCompanyName"
                defaultValue={defaultBilling.companyName}
                required={isCompany}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingCompanyAddress">Company address</Label>
              <Input
                id="billingCompanyAddress"
                name="billingCompanyAddress"
                defaultValue={defaultBilling.companyAddress}
                required={isCompany}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingCompanyTaxId">
                {isSerbia ? "PIB" : "VAT ID / Tax ID (optional)"}
              </Label>
              <Input
                id="billingCompanyTaxId"
                name="billingCompanyTaxId"
                defaultValue={defaultBilling.companyTaxId}
                inputMode={isSerbia ? "numeric" : "text"}
                maxLength={isSerbia ? 9 : undefined}
                required={isCompany && isSerbia}
              />
              <p className="text-xs text-muted-foreground">
                {isSerbia ? "PIB must have 9 digits." : "If available, enter it with the country prefix."}
              </p>
            </div>
          </div>
        )}
      </section>

      <Button type="submit" variant="accent" size="lg" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
