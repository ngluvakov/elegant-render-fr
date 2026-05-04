import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Copy, Euro, FilePenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatEur, priceItems, type QuoteItem } from "@/lib/catalog/calculate";
import {
  clonePublishedPricingToDraft,
  publishPricingBook,
  requireFinanceAdmin,
  savePricingDraftChange,
} from "@/server/actions/finance";
import {
  getDraftPricingCatalog,
  getPublishedPricingCatalog,
} from "@/server/pricing/catalog";

export const metadata: Metadata = {
  title: "Admin — Cenovnik i finansije",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PREVIEW_ITEMS: QuoteItem[] = [
  {
    instanceId: "preview-ext-static",
    productId: "ext-static",
    categoryId: "exterior",
    addOnQuantities: {
      "ext-static-cam": 2,
      "ext-static-extended": 0,
      "ext-static-photo": 0,
    },
  },
  {
    instanceId: "preview-floorplan-3d",
    productId: "fp-3d",
    categoryId: "floorplans-3d",
    addOnQuantities: {
      "fp-3d-floor": 1,
      "fp-3d-furniture": 0,
      "fp-3d-camera": 1,
    },
  },
];

export default async function PricingFinancePage() {
  await requireFinanceAdmin();
  const [draft, published] = await Promise.all([
    getDraftPricingCatalog(),
    getPublishedPricingCatalog(),
  ]);
  const draftPreview = priceItems(PREVIEW_ITEMS, [], draft);
  const publishedPreview = priceItems(PREVIEW_ITEMS, [], published);

  return (
    <div className="space-y-6">
      <Link
        href="/portal/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Admin
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Euro className="h-6 w-6 text-accent" />
            <h1 className="font-heading text-3xl text-foreground">
              Cenovnik i finansijska pravila
            </h1>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Osnovne cene su u EUR bez PDV-a. Draft izmene ne utiču na javni
            sajt, checkout ili portal dok se ne objave.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={clonePublishedPricingToDraft}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent/50"
            >
              <Copy className="h-4 w-4" />
              Resetuj draft iz objavljenog
            </button>
          </form>
          <form action={publishPricingBook}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
            >
              <CheckCircle2 className="h-4 w-4" />
              Publish
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusCard
          label="Draft"
          value={draft.name}
          meta={`Ažurirano ${formatDateTime(draft.updatedAt)}`}
          badge="Neobjavljeno"
        />
        <StatusCard
          label="Objavljeno"
          value={published.status === "static" ? "Fallback TS cenovnik" : published.name}
          meta={
            published.publishedAt
              ? `Objavljeno ${formatDateTime(published.publishedAt)}`
              : "Još nema DB publish-a"
          }
          badge={published.status === "static" ? "Fallback" : "Live"}
        />
        <div className="rounded-xl border border-border/40 bg-card/70 p-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Preview istim kalkulatorom
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Draft</p>
              <p className="text-xl font-bold text-foreground">
                {formatEur(draftPreview.total)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Live</p>
              <p className="text-xl font-bold text-foreground">
                {formatEur(publishedPreview.total)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <SettingsForm settings={draft.settings} />

      <div className="space-y-5">
        {draft.categories.map((category) => (
          <section
            key={category.id}
            className="rounded-2xl border border-border/40 bg-card/60 p-5"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {category.sectionLabel}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  {category.label}
                </h2>
              </div>
              <Badge className="bg-secondary text-muted-foreground">
                {category.products.length} proizvoda
              </Badge>
            </div>

            <div className="space-y-4">
              {category.products.map((product) => (
                <ProductEditor
                  key={product.id}
                  product={product}
                  categoryId={category.id}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function StatusCard({
  label,
  value,
  meta,
  badge,
}: {
  label: string;
  value: string;
  meta: string;
  badge: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <Badge className="bg-accent/10 text-accent">{badge}</Badge>
      </div>
      <p className="mt-3 text-base font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
    </div>
  );
}

function SettingsForm({
  settings,
}: {
  settings: Awaited<ReturnType<typeof getDraftPricingCatalog>>["settings"];
}) {
  return (
    <form
      action={savePricingDraftChange}
      className="rounded-2xl border border-border/40 bg-card/60 p-5"
    >
      <input type="hidden" name="kind" value="settings" />
      <div className="flex items-center gap-2">
        <FilePenLine className="h-4 w-4 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">
          Globalna finansijska podešavanja
        </h2>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Field
          label="EUR/RSD kurs"
          name="eurToRsdRate"
          defaultValue={settings.eurToRsdRate}
        />
        <Field
          label="PDV Srbija"
          name="serbiaVatRate"
          defaultValue={settings.serbiaVatRate}
          step="0.01"
        />
        <Field
          label="AI expiry meseci"
          name="aiCreditExpiresAfterMonths"
          defaultValue={settings.aiCreditExpiresAfterMonths}
          step="1"
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <JsonField
          label="AI credit paketi"
          name="aiCreditTiersJson"
          value={settings.aiCreditTiers}
        />
        <JsonField
          label="Specijalna pravila (enterijer, 360, tour assembly)"
          name="specialPricingJson"
          value={settings.specialPricing}
        />
      </div>
      <SaveButton />
    </form>
  );
}

function ProductEditor({
  product,
  categoryId,
}: {
  product: Awaited<ReturnType<typeof getDraftPricingCatalog>>["categories"][number]["products"][number];
  categoryId: string;
}) {
  return (
    <div className="rounded-xl border border-border/35 bg-background/45 p-4">
      <form action={savePricingDraftChange} className="space-y-4">
        <input type="hidden" name="kind" value="product" />
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="categoryId" value={categoryId} />
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_160px_auto]">
          <TextField label="Naziv" name="label" defaultValue={product.label} />
          <TextField
            label="Unit label"
            name="unitLabel"
            defaultValue={product.unitLabel}
          />
          <Field
            label="Osnovna EUR cena"
            name="basePriceEur"
            defaultValue={product.basePriceEur}
          />
          <label className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-foreground">
            <input
              type="checkbox"
              name="inquiryOnly"
              defaultChecked={product.inquiryOnly}
              className="h-4 w-4 rounded border-border"
            />
            Samo upit
          </label>
        </div>
        <TextareaField
          label="Uključeno (jedna stavka po redu)"
          name="includes"
          defaultValue={product.includes.join("\n")}
          rows={2}
        />
        <SaveButton />
      </form>

      {product.durationConfig && (
        <DurationEditor product={product} sourceMode={null} />
      )}
      {product.sourceModeRules &&
        Object.entries(product.sourceModeRules).map(([sourceMode, override]) =>
          product.durationConfig && override.perSecondEur ? (
            <DurationEditor
              key={sourceMode}
              product={product}
              sourceMode={sourceMode}
            />
          ) : null,
        )}

      {product.addOns.length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Add-on cene
          </h3>
          {product.addOns.map((addOn) => (
            <form
              key={addOn.id}
              action={savePricingDraftChange}
              className="rounded-lg border border-border/30 bg-card/50 p-3"
            >
              <input type="hidden" name="kind" value="addon" />
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="addOnId" value={addOn.id} />
              <div className="grid gap-3 lg:grid-cols-[1fr_1.5fr_120px_120px_120px]">
                <TextField label="Naziv" name="label" defaultValue={addOn.label} />
                <TextField
                  label="Opis"
                  name="description"
                  defaultValue={addOn.description}
                />
                <Field label="Cena EUR" name="priceEur" defaultValue={addOn.priceEur} />
                <Field
                  label="Uključeno"
                  name="includedQty"
                  defaultValue={addOn.includedQty}
                  step="1"
                />
                <Field
                  label="Max"
                  name="maxQty"
                  defaultValue={Number.isFinite(addOn.maxQty) ? addOn.maxQty : ""}
                  step="1"
                  required={false}
                />
              </div>
              <JsonField
                label="Volume pravila"
                name="volumeRulesJson"
                value={addOn.volumeRules}
              />
              <SaveButton />
            </form>
          ))}
        </div>
      )}

      {product.consumes && product.consumes.length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Cross-service popusti
          </h3>
          {product.consumes.map((rule, index) => (
            <form
              key={`${rule.requires}-${index}`}
              action={savePricingDraftChange}
              className="grid gap-3 rounded-lg border border-border/30 bg-card/50 p-3 lg:grid-cols-[1fr_120px_2fr_auto]"
            >
              <input type="hidden" name="kind" value="discount" />
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="ruleIndex" value={index} />
              <div>
                <p className="text-xs font-medium text-foreground">
                  {rule.requires}
                </p>
                <p className="mt-1 text-[0.68rem] text-muted-foreground">
                  {rule.sourceProducts?.join(", ") ?? "bilo koji izvor"}
                </p>
              </div>
              <Field
                label="Popust %"
                name="discountPct"
                defaultValue={rule.discountPct}
                step="1"
              />
              <TextField label="Razlog" name="reason" defaultValue={rule.reason} />
              <SaveButton compact />
            </form>
          ))}
        </div>
      )}
    </div>
  );
}

function DurationEditor({
  product,
  sourceMode,
}: {
  product: Awaited<ReturnType<typeof getDraftPricingCatalog>>["categories"][number]["products"][number];
  sourceMode: string | null;
}) {
  const config = product.durationConfig!;
  const perSecondEur = sourceMode
    ? product.sourceModeRules?.[sourceMode]?.perSecondEur ?? config.perSecondEur
    : config.perSecondEur;
  return (
    <form
      action={savePricingDraftChange}
      className="mt-4 rounded-lg border border-border/30 bg-card/50 p-3"
    >
      <input type="hidden" name="kind" value="duration" />
      <input type="hidden" name="productId" value={product.id} />
      {sourceMode && <input type="hidden" name="sourceMode" value={sourceMode} />}
      <h3 className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Trajanje {sourceMode ? `- ${sourceMode}` : ""}
      </h3>
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Min sekundi" name="minSeconds" defaultValue={config.minSeconds} step="1" />
        <Field label="Default sekundi" name="defaultSeconds" defaultValue={config.defaultSeconds} step="1" />
        <Field
          label="Max sekundi"
          name="maxSeconds"
          defaultValue={Number.isFinite(config.maxSeconds) ? config.maxSeconds : ""}
          step="1"
          required={false}
        />
        <Field label="EUR/sek" name="perSecondEur" defaultValue={perSecondEur} />
      </div>
      <JsonField
        label="Duration popusti"
        name="discountTiersJson"
        value={config.discountTiers.map((tier) => ({
          ...tier,
          maxSec: Number.isFinite(tier.maxSec) ? tier.maxSec : null,
        }))}
      />
      <SaveButton />
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  step = "0.01",
  required = true,
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  step?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        name={name}
        step={step}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </label>
  );
}

function TextField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <input
        type="text"
        name={name}
        required
        defaultValue={defaultValue}
        className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </label>
  );
}

function JsonField({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: unknown;
}) {
  return (
    <TextareaField
      label={label}
      name={name}
      defaultValue={JSON.stringify(value, null, 2)}
      rows={4}
    />
  );
}

function SaveButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="submit"
      className={
        compact
          ? "self-end rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent/90"
          : "mt-3 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent/90"
      }
    >
      Sačuvaj u draft
    </button>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("sr-Latn-RS", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
