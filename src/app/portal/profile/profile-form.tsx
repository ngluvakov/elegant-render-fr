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
        <div className="rounded-lg border border-border bg-accent/10 px-4 py-3 text-sm text-foreground">
          Vos informations ont été mises à jour.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">
          <Pencil className="h-3 w-3 text-accent/60" />
          Nom complet
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
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          value={defaultEmail}
          disabled
          className="opacity-60"
        />
        <p className="text-xs text-muted-foreground">
          L’adresse e-mail ne peut pas être modifiée.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          <Pencil className="h-3 w-3 text-accent/60" />
          Téléphone
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
          {hasPassword ? "Nouveau mot de passe (facultatif)" : "Définir un mot de passe"}
        </Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder={
            hasPassword ? "Laissez vide pour ne pas le changer" : "Au moins 8 caractères"
          }
        />
        {!hasPassword && (
          <p className="text-xs text-muted-foreground">
            Une fois défini, vous pourrez vous connecter directement sans
            attendre un lien par e-mail.
          </p>
        )}
      </div>

      <section className="space-y-5 rounded-lg border border-border/50 bg-card/60 p-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Coordonnées de facturation
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Utilisées par défaut pour les prochaines commandes et les frais
            complémentaires. Les factures déjà émises ne changeront pas.
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
                Particulier
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                La facture est émise au nom du compte.
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
                Entreprise
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Nous enregistrons les informations pour les factures.
              </span>
            </span>
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground">
              Pays de facturation <span className="ml-1 text-destructive">*</span>
            </span>
            <select
              name="billingCountryCode"
              value={billingCountryCode}
              onChange={(e) => setBillingCountryCode(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
              required
            >
              <option value="RS">Serbie (RS)</option>
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
            <span>Prochaines factures : EUR</span>
          </div>
        </div>

        {isCompany && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="billingCompanyName">Nom de l’entreprise</Label>
              <Input
                id="billingCompanyName"
                name="billingCompanyName"
                defaultValue={defaultBilling.companyName}
                required={isCompany}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingCompanyAddress">Adresse de l’entreprise</Label>
              <Input
                id="billingCompanyAddress"
                name="billingCompanyAddress"
                defaultValue={defaultBilling.companyAddress}
                required={isCompany}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingCompanyTaxId">
                {isSerbia ? "PIB" : "Numéro de TVA / identifiant fiscal (facultatif)"}
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
                {isSerbia ? "Le PIB doit comporter 9 chiffres." : "Si disponible, saisissez-le avec le préfixe du pays."}
              </p>
            </div>
          </div>
        )}
      </section>

      <Button type="submit" variant="accent" size="lg" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer les modifications"}
      </Button>
    </form>
  );
}
