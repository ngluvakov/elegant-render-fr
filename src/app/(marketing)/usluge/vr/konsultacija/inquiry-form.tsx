/**
 * VrInquiryForm — Client form for VR consultation intake.
 *
 * Reuses the catalog vocabularies (VR_EXPERIENCE_TYPES, VR_TARGET_DEVICES,
 * VR_LOCOMOTION, VR_DAY_NIGHT_MODES) so the inquiry shape matches the
 * VrConfig used elsewhere — admin can convert an inquiry to an order
 * with the captured config intact.
 *
 * Critical fields (contact + project basics) are above the fold;
 * advanced fields are in a collapsible.
 */
"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Headphones, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Collapsible } from "@/components/ui/collapsible";
import { usePublicCurrency } from "@/components/site/public-currency-provider";
import { submitVrInquiry } from "@/server/actions/vr-inquiry";
import { track } from "@/lib/posthog-events";
import { formatPublicPrice } from "@/lib/catalog/display-currency";
import {
  defaultVrConfig,
  VR_DAY_NIGHT_MODES,
  VR_EXPERIENCE_TYPES,
  VR_LOCOMOTION,
  VR_TARGET_DEVICES,
  type VrConfig,
  type VrDayNightModeId,
  type VrExperienceTypeId,
  type VrLocomotionId,
  type VrProductId,
  type VrTargetDeviceId,
} from "@/lib/catalog/vr-config";

type ProductOption = {
  id: VrProductId;
  label: string;
  basePriceEur: number;
};

type Props = {
  initialProductId: VrProductId;
  initialContact: { name?: string; email?: string; phone?: string };
  products: ProductOption[];
};

export function VrInquiryForm({
  initialProductId,
  initialContact,
  products,
}: Props) {
  const displayCurrency = usePublicCurrency();
  const [productId, setProductId] = useState<VrProductId>(initialProductId);
  const [contactName, setContactName] = useState(initialContact.name ?? "");
  const [email, setEmail] = useState(initialContact.email ?? "");
  const [phone, setPhone] = useState(initialContact.phone ?? "");
  const [message, setMessage] = useState("");
  const [config, setConfig] = useState<VrConfig>(() => defaultVrConfig());
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<
    | { kind: "idle" }
    | { kind: "success" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const patch = (p: Partial<VrConfig>) =>
    setConfig((prev) => ({ ...prev, ...p }));

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setResult({ kind: "idle" });
    const res = await submitVrInquiry({
      productId,
      config,
      contactName,
      email,
      phone: phone.trim() || undefined,
      message: message.trim() || undefined,
    });
    setPending(false);
    if ("error" in res) {
      setResult({ kind: "error", message: res.error });
      return;
    }
    track("vr_inquiry_submitted", {
      product_id: productId,
      experience_type: config.experienceType,
      target_device: config.targetDevice,
    });
    setResult({ kind: "success" });
  };

  if (result.kind === "success") {
    return (
      <div className="rounded-2xl border border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/[0.06] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-sage)] text-white">
          <Check className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">
          Upit primljen
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Hvala — proverite email za potvrdu. Tim se javlja u roku od{" "}
          <strong className="text-foreground">1 radnog dana</strong> da
          dogovorimo termin za konsultaciju.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* Product picker */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          1. Izaberite tip VR projekta
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((p) => {
            const isActive = p.id === productId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProductId(p.id)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
                  isActive
                    ? "border-accent bg-accent/[0.06]"
                    : "border-border/60 bg-card/60 hover:border-accent/40",
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Headphones className="h-4 w-4 text-accent" />
                    {p.label}
                  </span>
                  {isActive && <Check className="h-4 w-4 text-accent" />}
                </div>
                <span className="text-[0.78rem] text-muted-foreground">
                  Od {formatPublicPrice(p.basePriceEur, displayCurrency)} —
                  konsultacija pre izrade
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          2. Kontakt
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vri-name">
              <Pencil className="h-3 w-3 text-accent/60" />
              Ime i prezime
            </Label>
            <Input
              id="vri-name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
              autoComplete="name"
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vri-email">
              <Pencil className="h-3 w-3 text-accent/60" />
              Email
            </Label>
            <Input
              id="vri-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              maxLength={200}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vri-phone">
            <Pencil className="h-3 w-3 text-accent/60" />
            Telefon (opciono)
          </Label>
          <Input
            id="vri-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            maxLength={40}
          />
        </div>
      </section>

      {/* Project basics */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          3. Osnovno o projektu
        </h2>
        <div className="space-y-2">
          <Label htmlFor="vri-pname">
            <Pencil className="h-3 w-3 text-accent/60" />
            Naziv projekta
          </Label>
          <Input
            id="vri-pname"
            value={config.projectName}
            onChange={(e) => patch({ projectName: e.target.value })}
            maxLength={100}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vri-etype">Tip VR iskustva</Label>
            <select
              id="vri-etype"
              value={config.experienceType}
              onChange={(e) =>
                patch({
                  experienceType: e.target.value as VrExperienceTypeId,
                })
              }
              className="w-full rounded-md bg-secondary/40 px-2.5 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50"
            >
              {VR_EXPERIENCE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vri-device">Target uređaj</Label>
            <select
              id="vri-device"
              value={config.targetDevice}
              onChange={(e) =>
                patch({ targetDevice: e.target.value as VrTargetDeviceId })
              }
              className="w-full rounded-md bg-secondary/40 px-2.5 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50"
            >
              {VR_TARGET_DEVICES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vri-desc">
            <Pencil className="h-3 w-3 text-accent/60" />
            Opis projekta
          </Label>
          <Textarea
            id="vri-desc"
            value={config.description ?? ""}
            onChange={(e) => patch({ description: e.target.value })}
            rows={5}
            placeholder="Tip prostora, broj prostorija/etaža, namena (prezentacija / prodaja / treninzi), poseban zahtevi…"
            maxLength={2000}
          />
        </div>
      </section>

      {/* Optional message */}
      <section className="space-y-2">
        <Label htmlFor="vri-msg">
          <Pencil className="h-3 w-3 text-accent/60" />
          Dodatna poruka timu (opciono)
        </Label>
        <Textarea
          id="vri-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Rok, budžet, šta vam je najvažnije, fajlovi koje možete poslati posle…"
          maxLength={4000}
        />
      </section>

      {/* Advanced collapsible */}
      <section>
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-secondary/30 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">
              Tehničke želje (opciono)
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              Locomotion, interakcije, day/night, brending — ako već znate, popunite. Nema problema ako preskočite, dogovaramo na razgovoru.
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform",
              advancedOpen && "rotate-180",
            )}
          />
        </button>
        <Collapsible open={advancedOpen}>
          <div className="mt-3 space-y-4 rounded-xl border border-border/40 bg-card/60 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vri-loco">Locomotion (kretanje)</Label>
                <select
                  id="vri-loco"
                  value={config.locomotion ?? ""}
                  onChange={(e) =>
                    patch({
                      locomotion:
                        (e.target.value || undefined) as
                          | VrLocomotionId
                          | undefined,
                    })
                  }
                  className="w-full rounded-md bg-secondary/40 px-2.5 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50"
                >
                  <option value="">— ne znam još —</option>
                  {VR_LOCOMOTION.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vri-dn">Dan / noć</Label>
                <select
                  id="vri-dn"
                  value={config.dayNightMode ?? ""}
                  onChange={(e) =>
                    patch({
                      dayNightMode:
                        (e.target.value || undefined) as
                          | VrDayNightModeId
                          | undefined,
                    })
                  }
                  className="w-full rounded-md bg-secondary/40 px-2.5 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50"
                >
                  <option value="">— ne znam još —</option>
                  {VR_DAY_NIGHT_MODES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[0.72rem] uppercase tracking-wider text-muted-foreground">
                Interakcije
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    { key: "doorInteraction", label: "Vrata se otvaraju" },
                    {
                      key: "lightsInteraction",
                      label: "Korisnik pali svetla",
                    },
                    {
                      key: "materialsInteraction",
                      label: "Promena materijala",
                    },
                  ] as const
                ).map((opt) => {
                  const checked = config[opt.key];
                  return (
                    <label
                      key={opt.key}
                      className="flex cursor-pointer items-center gap-2 rounded-md bg-secondary/30 px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-accent"
                        checked={checked}
                        onChange={(e) =>
                          patch({ [opt.key]: e.target.checked })
                        }
                      />
                      <span className="text-[0.78rem] text-foreground">
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <label
              htmlFor="vri-brand"
              className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-secondary/30 px-3 py-2"
            >
              <span className="text-[0.78rem] font-medium text-foreground">
                White-label brending (vaš logo + boje)
              </span>
              <Switch
                id="vri-brand"
                checked={config.brandingEnabled}
                onCheckedChange={(v) => patch({ brandingEnabled: v })}
              />
            </label>
          </div>
        </Collapsible>
      </section>

      {result.kind === "error" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/[0.06] px-4 py-3 text-sm text-destructive">
          {result.message}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-6">
        <p className="text-xs text-muted-foreground">
          {selectedProduct
            ? `Šaljete upit za ${selectedProduct.label}`
            : "Šaljete VR upit"}
        </p>
        <Button type="submit" size="xl" variant="accent" disabled={pending}>
          {pending ? "Šaljemo…" : "Pošalji upit"}
        </Button>
      </div>
    </form>
  );
}
