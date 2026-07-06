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
import {
  usePublicCurrency,
  usePublicPricingSettings,
} from "@/components/site/public-currency-provider";
import { submitVrInquiry } from "@/server/actions/vr-inquiry";
import { track } from "@/lib/posthog-events";
import { pushGoogleDataLayerEvent } from "@/lib/analytics/google-data-layer-client";
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
  const pricingSettings = usePublicPricingSettings();
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
    pushGoogleDataLayerEvent({
      event: "generate_lead",
      value: 0,
      currency: "EUR",
      event_id: `lead:${res.inquiryId}`,
      lead_type: "vr_inquiry",
      source_path: window.location.pathname,
      conversion_source: "vr_consultation_form",
      product_id: productId,
      experience_type: config.experienceType,
      target_device: config.targetDevice,
    });
    setResult({ kind: "success" });
  };

  if (result.kind === "success") {
    return (
      <div className="rounded-2xl border border-border bg-secondary p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Check className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">
          Inquiry received
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Thank you — check your email for a confirmation. The team replies
          within <strong className="text-foreground">1 working day</strong> to
          schedule the consultation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* Product picker */}
      <section className="space-y-3">
        <h2 className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          1. Choose the VR project type
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
                  "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors duration-200",
                  isActive
                    ? "border-accent bg-accent/[0.06]"
                    : "border-border/60 bg-card/60 hover:border-[#d4d4d4]",
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
                  From{" "}
                  {formatPublicPrice(
                    p.basePriceEur,
                    displayCurrency,
                    pricingSettings,
                  )}{" "}
                  —
                  consultation before production
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          2. Contact
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vri-name">
              <Pencil className="h-3 w-3 text-accent/60" />
              Full name
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
            Phone (optional)
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
        <h2 className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          3. Project basics
        </h2>
        <div className="space-y-2">
          <Label htmlFor="vri-pname">
            <Pencil className="h-3 w-3 text-accent/60" />
            Project name
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
            <Label htmlFor="vri-etype">VR experience type</Label>
            <select
              id="vri-etype"
              value={config.experienceType}
              onChange={(e) =>
                patch({
                  experienceType: e.target.value as VrExperienceTypeId,
                })
              }
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {VR_EXPERIENCE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vri-device">Target device</Label>
            <select
              id="vri-device"
              value={config.targetDevice}
              onChange={(e) =>
                patch({ targetDevice: e.target.value as VrTargetDeviceId })
              }
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
            Project description
          </Label>
          <Textarea
            id="vri-desc"
            value={config.description ?? ""}
            onChange={(e) => patch({ description: e.target.value })}
            rows={5}
            placeholder="Type of space, number of rooms/floors, purpose (presentation / sales / training), special requirements…"
            maxLength={2000}
          />
        </div>
      </section>

      {/* Optional message */}
      <section className="space-y-2">
        <Label htmlFor="vri-msg">
          <Pencil className="h-3 w-3 text-accent/60" />
          Additional message for the team (optional)
        </Label>
        <Textarea
          id="vri-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Timeline, budget, what matters most to you, files you can send later…"
          maxLength={4000}
        />
      </section>

      {/* Advanced collapsible */}
      <section>
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-secondary/30 px-4 py-3 text-left transition-colors duration-200 hover:bg-secondary/50"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">
              Technical preferences (optional)
            </p>
            <p className="text-[0.72rem] text-muted-foreground">
              Locomotion, interactions, day/night, branding — fill these in if
              you already know. No problem if you skip them; we settle the
              details on the call.
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
                <Label htmlFor="vri-loco">Locomotion (movement)</Label>
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
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">— not sure yet —</option>
                  {VR_LOCOMOTION.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vri-dn">Day / night</Label>
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
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">— not sure yet —</option>
                  {VR_DAY_NIGHT_MODES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Interactions
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    { key: "doorInteraction", label: "Doors open" },
                    {
                      key: "lightsInteraction",
                      label: "User turns lights on",
                    },
                    {
                      key: "materialsInteraction",
                      label: "Material switching",
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
                White-label branding (your logo + colors)
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
            ? `You are sending an inquiry for ${selectedProduct.label}`
            : "You are sending a VR inquiry"}
        </p>
        <Button type="submit" size="xl" variant="accent" disabled={pending}>
          {pending ? "Sending…" : "Send an inquiry"}
        </Button>
      </div>
    </form>
  );
}
