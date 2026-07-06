"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  CircleDollarSign,
  Eye,
  FileJson,
  Layers3,
  Minus,
  PackageCheck,
  Plus,
  Save,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  formatEur,
  priceItems,
  type QuoteItem,
} from "@/lib/catalog/calculate";
import type {
  ConfiguratorAddOn,
  ConfiguratorProduct,
  ConsumeRule,
  DurationConfig,
  VolumeRule,
} from "@/lib/catalog/configurator";
import {
  AI_CREDIT_CATEGORY_ID,
  AI_CREDIT_PRODUCT_ID,
  calculateAiCreditPurchase,
} from "@/lib/ai-studio/catalog";
import type {
  PricingSettings,
  ResolvedPricingCatalog,
} from "@/lib/pricing/catalog";
import { defaultTourAssembly } from "@/lib/catalog/tour-assembly";
import {
  clonePublishedPricingToDraft,
  publishPricingBook,
  savePricingDraftVisualPatch,
  type PricingDraftVisualPatch,
} from "@/server/actions/finance";

type Category = ResolvedPricingCatalog["categories"][number];
type Product = Category["products"][number];
type AddOn = Product["addOns"][number];

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
    productId: "fp3d-single",
    categoryId: "floorplans-3d",
    addOnQuantities: {
      "fp3d-second": 0,
      "fp3d-extra": 1,
      "fp3d-furniture": 1,
    },
  },
];

type Notice =
  | { kind: "idle" }
  | { kind: "success"; text: string }
  | { kind: "error"; text: string };

export function PricingWorkbench({
  initialDraft,
  published,
}: {
  initialDraft: ResolvedPricingCatalog;
  published: ResolvedPricingCatalog;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft);
  const [activeCategoryId, setActiveCategoryId] = useState(
    initialDraft.categories[0]?.id ?? "settings",
  );
  const [notice, setNotice] = useState<Notice>({ kind: "idle" });
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeCategory = draft.categories.find(
    (category) => category.id === activeCategoryId,
  );
  const draftPreview = useMemo(() => priceItems(PREVIEW_ITEMS, [], draft), [draft]);
  const livePreview = useMemo(
    () => priceItems(PREVIEW_ITEMS, [], published),
    [published],
  );

  const savePatch = async (
    key: string,
    patch: PricingDraftVisualPatch,
    successText: string,
  ) => {
    setSavingKey(key);
    setNotice({ kind: "idle" });
    try {
      const next = await savePricingDraftVisualPatch(patch);
      setDraft(next);
      setNotice({ kind: "success", text: successText });
      router.refresh();
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Change was not saved.",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const updateProduct = (
    productId: string,
    updater: (product: Product) => Product,
  ) => {
    setDraft((current) => ({
      ...current,
      categories: current.categories.map((category) => ({
        ...category,
        products: category.products.map((product) =>
          product.id === productId ? updater(product) : product,
        ),
      })),
    }));
  };

  const updateSettings = (updater: (settings: PricingSettings) => PricingSettings) => {
    setDraft((current) => ({
      ...current,
      settings: updater(current.settings),
    }));
  };

  const handlePublish = () => {
    setNotice({ kind: "idle" });
    startTransition(async () => {
      try {
        await publishPricingBook();
        setNotice({ kind: "success", text: "Draft was published as the live pricebook." });
        router.refresh();
      } catch (error) {
        setNotice({
          kind: "error",
          text:
            error instanceof Error
              ? error.message
              : "Pricebook was not published.",
        });
      }
    });
  };

  const handleClone = () => {
    setNotice({ kind: "idle" });
    startTransition(async () => {
      try {
        await clonePublishedPricingToDraft();
        setNotice({
          kind: "success",
          text: "Draft was reset from the currently published pricebook.",
        });
        router.refresh();
      } catch (error) {
        setNotice({
          kind: "error",
          text:
            error instanceof Error
              ? error.message
              : "Draft was not reset.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-6 w-6 text-accent" />
            <h1 className="font-heading text-3xl text-foreground">
              Pricebook and financial rules
            </h1>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Visual workbench for the draft pricebook. Changes appear immediately in the preview, but are saved only when you click Save.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClone}
            disabled={isPending || Boolean(savingKey)}
          >
            <Copy className="h-4 w-4" />
            Reset draft
          </Button>
          <Button
            type="button"
            variant="accent"
            onClick={handlePublish}
            disabled={isPending || Boolean(savingKey)}
          >
            <CheckCircle2 className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      {notice.kind !== "idle" && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm",
            notice.kind === "success"
              ? "border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/10 text-[color:var(--color-sage-deep)]"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {notice.kind === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {notice.text}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        <StatusCard
          label="Draft"
          value={draft.name}
          meta={`Updated ${formatDateTime(draft.updatedAt)}`}
          badge="Preview"
        />
        <StatusCard
          label="Live"
          value={published.status === "static" ? "Fallback TS pricebook" : published.name}
          meta={
            published.publishedAt
              ? `Published ${formatDateTime(published.publishedAt)}`
              : "No DB publish yet"
          }
          badge={published.status === "static" ? "Fallback" : "Published"}
        />
        <PreviewCard
          label="Draft test calculation"
          total={draftPreview.total}
          original={draftPreview.originalTotal}
        />
        <PreviewCard
          label="Live test calculation"
          total={livePreview.total}
          original={livePreview.originalTotal}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-3 xl:sticky xl:top-4 xl:self-start">
          <button
            type="button"
            onClick={() => setActiveCategoryId("settings")}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
              activeCategoryId === "settings"
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border/40 bg-card/60 text-muted-foreground hover:border-accent/40 hover:text-foreground",
            )}
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Global rules
            </span>
            <Badge variant="secondary">AI + rate + VAT</Badge>
          </button>
          {draft.categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategoryId(category.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                activeCategoryId === category.id
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border/40 bg-card/60 text-muted-foreground hover:border-accent/40 hover:text-foreground",
              )}
            >
              <span>
                <span className="block font-medium">{category.label}</span>
                <span className="mt-0.5 block text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                  {category.sectionLabel}
                </span>
              </span>
              <Badge variant="outline">{category.products.length}</Badge>
            </button>
          ))}
        </aside>

        <main className="min-w-0 space-y-5">
          {activeCategoryId === "settings" ? (
            <SettingsWorkbench
              settings={draft.settings}
              saving={savingKey === "settings"}
              onSettingsChange={updateSettings}
              onSave={() =>
                savePatch(
                  "settings",
                  { kind: "settings", settings: draft.settings },
                  "Global financial settings were saved to draft.",
                )
              }
            />
          ) : activeCategory ? (
            <CategoryWorkbench
              category={activeCategory}
              catalog={draft}
              savingKey={savingKey}
              onProductChange={updateProduct}
              onSavePatch={savePatch}
            />
          ) : null}
        </main>
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardDescription className="text-[0.72rem] font-semibold uppercase tracking-[0.18em]">
            {label}
          </CardDescription>
          <Badge variant="secondary">{badge}</Badge>
        </div>
        <CardTitle>{value}</CardTitle>
        <CardDescription>{meta}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function PreviewCard({
  label,
  total,
  original,
}: {
  label: string;
  total: number;
  original: number;
}) {
  const savings = Math.max(0, original - total);
  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-[0.72rem] font-semibold uppercase tracking-[0.18em]">
          {label}
        </CardDescription>
        <CardTitle className="text-2xl tabular-nums">{formatEur(total)}</CardTitle>
        <CardDescription>
          {savings > 0 ? `Test savings: ${formatEur(savings)}` : "No discount in test"}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function CategoryWorkbench({
  category,
  catalog,
  savingKey,
  onProductChange,
  onSavePatch,
}: {
  category: Category;
  catalog: ResolvedPricingCatalog;
  savingKey: string | null;
  onProductChange: (productId: string, updater: (product: Product) => Product) => void;
  onSavePatch: (
    key: string,
    patch: PricingDraftVisualPatch,
    successText: string,
  ) => Promise<void>;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {category.sectionLabel}
          </p>
          <h2 className="mt-1 font-heading text-2xl text-foreground">
            {category.label}
          </h2>
        </div>
        <Badge variant="outline">{category.products.length} products</Badge>
      </div>

      <div className="space-y-4">
        {category.products.map((product) => (
          <ProductWorkbenchCard
            key={product.id}
            category={category}
            product={product}
            catalog={catalog}
            savingKey={savingKey}
            onProductChange={onProductChange}
            onSavePatch={onSavePatch}
          />
        ))}
      </div>
    </section>
  );
}

function ProductWorkbenchCard({
  category,
  product,
  catalog,
  savingKey,
  onProductChange,
  onSavePatch,
}: {
  category: Category;
  product: Product;
  catalog: ResolvedPricingCatalog;
  savingKey: string | null;
  onProductChange: (productId: string, updater: (product: Product) => Product) => void;
  onSavePatch: (
    key: string,
    patch: PricingDraftVisualPatch,
    successText: string,
  ) => Promise<void>;
}) {
  const [previewSeconds, setPreviewSeconds] = useState(
    product.durationConfig?.defaultSeconds ?? 30,
  );
  const [previewQuantities, setPreviewQuantities] = useState<Record<string, number>>(
    () =>
      Object.fromEntries(
        product.addOns.map((addOn) => [addOn.id, addOn.includedQty]),
      ),
  );
  const [expanded, setExpanded] = useState(true);

  const previewItem = useMemo(
    () =>
      makePreviewItem(
        category.id,
        product,
        previewQuantities,
        previewSeconds,
      ),
    [category.id, product, previewQuantities, previewSeconds],
  );
  const preview = useMemo(
    () => priceItems([previewItem], [], catalog).items[0],
    [catalog, previewItem],
  );

  const saveProduct = () =>
    onSavePatch(
      `product:${product.id}`,
      {
        kind: "product",
        productId: product.id,
        label: product.label,
        unitLabel: product.unitLabel,
        basePriceEur: product.basePriceEur,
        includes: product.includes,
        inquiryOnly: product.inquiryOnly ?? false,
      },
      `${product.label} was saved to draft.`,
    );

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{category.label}</Badge>
              {product.inquiryOnly && <Badge variant="outline">Inquiry only</Badge>}
              {product.durationConfig && <Badge variant="outline">Duration</Badge>}
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_1fr_180px]">
              <TextInput
                label="Package name"
                value={product.label}
                onChange={(label) =>
                  onProductChange(product.id, (current) => ({
                    ...current,
                    label,
                  }))
                }
              />
              <TextInput
                label="Billing model"
                value={product.unitLabel}
                onChange={(unitLabel) =>
                  onProductChange(product.id, (current) => ({
                    ...current,
                    unitLabel,
                  }))
                }
              />
              <NumberInput
                label={product.durationConfig ? "Fallback base EUR" : "Base price EUR"}
                value={product.basePriceEur}
                min={0}
                onChange={(basePriceEur) =>
                  onProductChange(product.id, (current) => ({
                    ...current,
                    basePriceEur,
                  }))
                }
              />
            </div>
          </div>
          <MiniProductPreview
            total={preview?.totalEur ?? 0}
            original={preview?.originalTotalEur ?? 0}
            label="Mini calculation"
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <IncludesEditor
            includes={product.includes}
            onChange={(includes) =>
              onProductChange(product.id, (current) => ({
                ...current,
                includes,
              }))
            }
          />
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/45 px-4 py-3 lg:flex-col lg:items-start lg:justify-center">
            <Label htmlFor={`inquiry-${product.id}`} className="text-xs">
              Inquiry only
            </Label>
            <Switch
              id={`inquiry-${product.id}`}
              checked={product.inquiryOnly ?? false}
              onCheckedChange={(inquiryOnly) =>
                onProductChange(product.id, (current) => ({
                  ...current,
                  inquiryOnly,
                }))
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
            />
            Price details
          </Button>
          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={saveProduct}
            disabled={savingKey === `product:${product.id}`}
          >
            <Save className="h-4 w-4" />
            Save package
          </Button>
        </div>
      </CardHeader>

      <Collapsible open={expanded}>
        <CardContent className="space-y-4 border-t border-border/50 pt-4">
          {product.durationConfig && (
            <DurationWorkbench
              product={product}
              previewSeconds={previewSeconds}
              savingKey={savingKey}
              onPreviewSecondsChange={setPreviewSeconds}
              onProductChange={onProductChange}
              onSavePatch={onSavePatch}
            />
          )}

          {product.addOns.length > 0 && (
            <div className="space-y-3">
              <SectionTitle
                icon={PackageCheck}
                title="Add-on prices"
                description="Set what is included, add-ons, and quantity thresholds."
              />
              {product.addOns.map((addOn) => (
                <AddOnWorkbench
                  key={addOn.id}
                  productId={product.id}
                  addOn={addOn}
                  previewQty={previewQuantities[addOn.id] ?? addOn.includedQty}
                  saving={savingKey === `addon:${product.id}:${addOn.id}`}
                  onPreviewQtyChange={(quantity) =>
                    setPreviewQuantities((current) => ({
                      ...current,
                      [addOn.id]: quantity,
                    }))
                  }
                  onChange={(next) =>
                    onProductChange(product.id, (current) => ({
                      ...current,
                      addOns: current.addOns.map((item) =>
                        item.id === addOn.id ? next : item,
                      ),
                    }))
                  }
                  onSave={() =>
                    onSavePatch(
                      `addon:${product.id}:${addOn.id}`,
                      {
                        kind: "addon",
                        productId: product.id,
                        addOnId: addOn.id,
                        label: addOn.label,
                        description: addOn.description,
                        priceEur: addOn.priceEur,
                        includedQty: addOn.includedQty,
                        maxQty: Number.isFinite(addOn.maxQty) ? addOn.maxQty : null,
                        volumeRules: addOn.volumeRules,
                      },
                      `${addOn.label} was saved to draft.`,
                    )
                  }
                />
              ))}
            </div>
          )}

          {product.consumes && product.consumes.length > 0 && (
            <DiscountRulesWorkbench
              product={product}
              savingKey={savingKey}
              onProductChange={onProductChange}
              onSavePatch={onSavePatch}
            />
          )}
        </CardContent>
      </Collapsible>
    </Card>
  );
}

function DurationWorkbench({
  product,
  previewSeconds,
  savingKey,
  onPreviewSecondsChange,
  onProductChange,
  onSavePatch,
}: {
  product: Product;
  previewSeconds: number;
  savingKey: string | null;
  onPreviewSecondsChange: (seconds: number) => void;
  onProductChange: (productId: string, updater: (product: Product) => Product) => void;
  onSavePatch: (
    key: string,
    patch: PricingDraftVisualPatch,
    successText: string,
  ) => Promise<void>;
}) {
  if (!product.durationConfig) return null;
  const config = product.durationConfig;
  const discountPct = durationDiscountPct(config, previewSeconds);
  const subtotal = config.perSecondEur * previewSeconds;
  const total = Math.round(subtotal * (1 - discountPct / 100));

  const saveDuration = (sourceMode: string | null = null) => {
    const perSecondEur = sourceMode
      ? product.sourceModeRules?.[sourceMode]?.perSecondEur ?? config.perSecondEur
      : config.perSecondEur;
    return onSavePatch(
      `duration:${product.id}:${sourceMode ?? "base"}`,
      {
        kind: "duration",
        productId: product.id,
        sourceMode,
        minSeconds: config.minSeconds,
        defaultSeconds: config.defaultSeconds,
        maxSeconds: Number.isFinite(config.maxSeconds) ? config.maxSeconds : null,
        perSecondEur,
        discountTiers: config.discountTiers,
      },
      `Duration for ${product.label} je saved to draft.`,
    );
  };

  return (
    <div className="rounded-xl border border-border/50 bg-background/45 p-4">
      <SectionTitle
        icon={SlidersHorizontal}
        title="Duration and price per second"
        description="The slider shows how seconds and duration discounts change the calculation."
      />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <NumberInput
              label="Minimum seconds"
              value={config.minSeconds}
              step={1}
              min={1}
              onChange={(minSeconds) =>
                onProductChange(product.id, (current) => ({
                  ...current,
                  durationConfig: {
                    ...current.durationConfig!,
                    minSeconds: Math.floor(minSeconds),
                  },
                }))
              }
            />
            <NumberInput
              label="Default seconds"
              value={config.defaultSeconds}
              step={1}
              min={1}
              onChange={(defaultSeconds) =>
                onProductChange(product.id, (current) => ({
                  ...current,
                  durationConfig: {
                    ...current.durationConfig!,
                    defaultSeconds: Math.floor(defaultSeconds),
                  },
                }))
              }
            />
            <NumberInput
              label="Maximum seconds"
              value={Number.isFinite(config.maxSeconds) ? config.maxSeconds : 240}
              step={1}
              min={1}
              onChange={(maxSeconds) =>
                onProductChange(product.id, (current) => ({
                  ...current,
                  durationConfig: {
                    ...current.durationConfig!,
                    maxSeconds: Math.floor(maxSeconds),
                  },
                }))
              }
            />
            <NumberInput
              label="EUR/sec"
              value={config.perSecondEur}
              min={0}
              onChange={(perSecondEur) =>
                onProductChange(product.id, (current) => ({
                  ...current,
                  durationConfig: {
                    ...current.durationConfig!,
                    perSecondEur,
                  },
                }))
              }
            />
          </div>

          <div className="rounded-xl border border-border/40 bg-card/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs">Duration preview</Label>
              <span className="text-sm font-semibold tabular-nums">
                {previewSeconds}s
              </span>
            </div>
            <input
              type="range"
              min={config.minSeconds}
              max={Number.isFinite(config.maxSeconds) ? config.maxSeconds : 240}
              value={Math.max(config.minSeconds, previewSeconds)}
              onChange={(event) => onPreviewSecondsChange(Number(event.target.value))}
              className="mt-3 w-full accent-accent"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{config.minSeconds}s</span>
              <span>{Number.isFinite(config.maxSeconds) ? `${config.maxSeconds}s` : "no limit"}</span>
            </div>
          </div>

          <DurationTiersEditor
            tiers={config.discountTiers}
            onChange={(discountTiers) =>
              onProductChange(product.id, (current) => ({
                ...current,
                durationConfig: {
                  ...current.durationConfig!,
                  discountTiers,
                },
              }))
            }
          />
        </div>

        <div className="rounded-xl border border-accent/25 bg-accent/10 p-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Live calculation
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <PriceRow label={`${previewSeconds}s × ${formatEur(config.perSecondEur)}`} value={formatEur(subtotal)} />
            <PriceRow label="Duration discount" value={discountPct > 0 ? `−${discountPct}%` : "0%"} />
            <PriceRow label="Total" value={formatEur(total)} strong />
          </div>
          <Button
            type="button"
            variant="accent"
            size="sm"
            className="mt-4 w-full"
            onClick={() => saveDuration(null)}
            disabled={savingKey === `duration:${product.id}:base`}
          >
            <Save className="h-4 w-4" />
            Save duration
          </Button>
        </div>
      </div>

      {product.sourceModeRules && Object.keys(product.sourceModeRules).length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {Object.entries(product.sourceModeRules).map(([sourceMode, rule]) => (
            <div
              key={sourceMode}
              className="rounded-xl border border-border/40 bg-card/60 p-3"
            >
              <p className="text-xs font-semibold text-foreground">{sourceMode}</p>
              <NumberInput
                label="EUR/sec for mode"
                value={rule.perSecondEur ?? config.perSecondEur}
                min={0}
                onChange={(perSecondEur) =>
                  onProductChange(product.id, (current) => ({
                    ...current,
                    sourceModeRules: {
                      ...current.sourceModeRules,
                      [sourceMode]: {
                        ...(current.sourceModeRules?.[sourceMode] ?? {}),
                        perSecondEur,
                      },
                    },
                  }))
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => saveDuration(sourceMode)}
                disabled={savingKey === `duration:${product.id}:${sourceMode}`}
              >
                <Save className="h-4 w-4" />
                Save mode
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddOnWorkbench({
  productId,
  addOn,
  previewQty,
  saving,
  onPreviewQtyChange,
  onChange,
  onSave,
}: {
  productId: string;
  addOn: AddOn;
  previewQty: number;
  saving: boolean;
  onPreviewQtyChange: (quantity: number) => void;
  onChange: (addOn: AddOn) => void;
  onSave: () => void;
}) {
  const billableQty = Math.max(0, previewQty - addOn.includedQty);
  const unitPrice = unitPriceForQuantity(addOn, previewQty);
  const previewTotal =
    addOn.priceType === "percent"
      ? `+${addOn.priceEur}%`
      : formatEur(Math.round(unitPrice * billableQty));
  const max = Number.isFinite(addOn.maxQty) ? addOn.maxQty : 30;

  return (
    <div className="rounded-xl border border-border/45 bg-card/60 p-4">
      <div className="grid gap-4 xl:grid-cols-[1fr_220px]">
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_1.4fr]">
            <TextInput
              label="Add-on name"
              value={addOn.label}
              onChange={(label) => onChange({ ...addOn, label })}
            />
            <TextInput
              label="Customer description"
              value={addOn.description}
              onChange={(description) => onChange({ ...addOn, description })}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <NumberInput
              label={addOn.priceType === "percent" ? "Percentage" : "Price EUR"}
              value={addOn.priceEur}
              min={0}
              onChange={(priceEur) => onChange({ ...addOn, priceEur })}
            />
            <NumberInput
              label="Included"
              value={addOn.includedQty}
              step={1}
              min={0}
              onChange={(includedQty) =>
                onChange({ ...addOn, includedQty: Math.floor(includedQty) })
              }
            />
            <NumberInput
              label="Max"
              value={Number.isFinite(addOn.maxQty) ? addOn.maxQty : 0}
              step={1}
              min={0}
              onChange={(maxQty) =>
                onChange({
                  ...addOn,
                  maxQty: maxQty > 0 ? Math.floor(maxQty) : Infinity,
                })
              }
            />
            <div>
              <Label className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                Price type
              </Label>
              <div className="mt-2 rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm font-medium">
                {addOn.priceType === "percent" ? "Percentage" : "Fixed"}
              </div>
            </div>
          </div>
          <VolumeRulesEditor
            productId={productId}
            addOn={addOn}
            onChange={(volumeRules) => onChange({ ...addOn, volumeRules })}
          />
        </div>

        <div className="rounded-xl border border-accent/25 bg-accent/10 p-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Test quantities
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <Stepper
              value={previewQty}
              min={0}
              max={max}
              onChange={onPreviewQtyChange}
              label={addOn.label}
            />
            <span className="text-sm font-semibold tabular-nums">
              {previewTotal}
            </span>
          </div>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <PriceRow label="Included" value={`${addOn.includedQty}`} />
            <PriceRow label="Naplativo" value={`${billableQty}`} />
            <PriceRow
              label="Effective unit price"
              value={addOn.priceType === "percent" ? `${addOn.priceEur}%` : formatEur(unitPrice)}
            />
          </div>
          <Button
            type="button"
            variant="accent"
            size="sm"
            className="mt-4 w-full"
            onClick={onSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            Save add-on
          </Button>
        </div>
      </div>
    </div>
  );
}

function VolumeRulesEditor({
  addOn,
  onChange,
}: {
  productId: string;
  addOn: AddOn;
  onChange: (rules: VolumeRule[]) => void;
}) {
  const updateRule = (index: number, patch: Partial<VolumeRule>) => {
    onChange(
      addOn.volumeRules.map((rule, i) =>
        i === index ? { ...rule, ...patch } : rule,
      ),
    );
  };

  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-foreground">
            Quantity thresholds
          </p>
          <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
            Example: from the 5th unit, the price becomes lower per unit.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() =>
            onChange([
              ...addOn.volumeRules,
              {
                afterQty:
                  (addOn.volumeRules[addOn.volumeRules.length - 1]?.afterQty ??
                    addOn.includedQty) + 1,
                priceEur: addOn.priceEur,
              },
            ])
          }
        >
          <Plus className="h-3 w-3" />
          Threshold
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {addOn.volumeRules.length === 0 && (
          <p className="rounded-lg bg-card/50 px-3 py-2 text-xs text-muted-foreground">
            No quantity rules; every additional unit uses the base price.
          </p>
        )}
        {addOn.volumeRules.map((rule, index) => (
          <div
            key={`${rule.afterQty}-${index}`}
            className="grid items-end gap-2 rounded-lg bg-card/60 p-2 md:grid-cols-[1fr_1fr_auto]"
          >
            <NumberInput
              label="After quantity"
              value={rule.afterQty}
              step={1}
              min={0}
              onChange={(afterQty) =>
                updateRule(index, { afterQty: Math.floor(afterQty) })
              }
            />
            <NumberInput
              label="Price EUR"
              value={rule.priceEur}
              min={0}
              onChange={(priceEur) => updateRule(index, { priceEur })}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              onClick={() =>
                onChange(addOn.volumeRules.filter((_, i) => i !== index))
              }
              aria-label="Remove threshold"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscountRulesWorkbench({
  product,
  savingKey,
  onProductChange,
  onSavePatch,
}: {
  product: Product;
  savingKey: string | null;
  onProductChange: (productId: string, updater: (product: Product) => Product) => void;
  onSavePatch: (
    key: string,
    patch: PricingDraftVisualPatch,
    successText: string,
  ) => Promise<void>;
}) {
  const rules = product.consumes ?? [];
  return (
    <div className="space-y-3">
      <SectionTitle
        icon={Layers3}
        title="Cross-service discounts"
        description="Visual rule: if a source model/service exists, this item receives a discount."
      />
      <div className="grid gap-3 lg:grid-cols-2">
        {rules.map((rule, index) => (
          <DiscountRuleCard
            key={`${rule.requires}-${index}`}
            product={product}
            rule={rule}
            index={index}
            saving={savingKey === `discount:${product.id}:${index}`}
            onChange={(next) =>
              onProductChange(product.id, (current) => ({
                ...current,
                consumes: (current.consumes ?? []).map((item, i) =>
                  i === index ? next : item,
                ),
              }))
            }
            onSave={() =>
              onSavePatch(
                `discount:${product.id}:${index}`,
                {
                  kind: "discount",
                  productId: product.id,
                  ruleIndex: index,
                  discountPct: rule.discountPct,
                  reason: rule.reason,
                },
                `Discount for ${product.label} was saved to draft.`,
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

function DiscountRuleCard({
  product,
  rule,
  index,
  saving,
  onChange,
  onSave,
}: {
  product: Product;
  rule: ConsumeRule;
  index: number;
  saving: boolean;
  onChange: (rule: ConsumeRule) => void;
  onSave: () => void;
}) {
  const discounted = Math.round(product.basePriceEur * (1 - rule.discountPct / 100));
  return (
    <div className="rounded-xl border border-border/45 bg-card/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            If present
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {rule.sourceProducts?.join(", ") ?? rule.requires}
          </p>
        </div>
        <ArrowRight className="mt-5 h-4 w-4 text-muted-foreground" />
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Then
          </p>
          <p className="mt-1 text-sm font-semibold text-[color:var(--color-sage-deep)]">
            −{rule.discountPct}%
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[120px_1fr]">
        <NumberInput
          label="Discount %"
          value={rule.discountPct}
          step={1}
          min={0}
          max={100}
          onChange={(discountPct) =>
            onChange({ ...rule, discountPct: Math.round(discountPct) })
          }
        />
        <TextInput
          label="Reason shown in calculation"
          value={rule.reason}
          onChange={(reason) => onChange({ ...rule, reason })}
        />
      </div>
      <div className="mt-3 rounded-lg bg-background/50 px-3 py-2 text-xs">
        <PriceRow label="Base example" value={formatEur(product.basePriceEur)} />
        <PriceRow label="After discount" value={formatEur(discounted)} strong />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        onClick={onSave}
        disabled={saving}
      >
        <Save className="h-4 w-4" />
        Save discount #{index + 1}
      </Button>
    </div>
  );
}

function SettingsWorkbench({
  settings,
  saving,
  onSettingsChange,
  onSave,
}: {
  settings: PricingSettings;
  saving: boolean;
  onSettingsChange: (updater: (settings: PricingSettings) => PricingSettings) => void;
  onSave: () => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedJson, setAdvancedJson] = useState(() =>
    JSON.stringify(settings, null, 2),
  );
  const [advancedError, setAdvancedError] = useState<string | null>(null);

  const applyAdvanced = () => {
    try {
      const parsed = JSON.parse(advancedJson) as PricingSettings;
      onSettingsChange(() => parsed);
      setAdvancedError(null);
    } catch {
      setAdvancedError("JSON is invalid.");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Finance settings
          </p>
          <h2 className="mt-1 font-heading text-2xl text-foreground">
            Global rules, AI packages, and special pricing
          </h2>
        </div>
        <Button type="button" variant="accent" onClick={onSave} disabled={saving}>
          <Save className="h-4 w-4" />
          Save settings
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricEditor
          label="VAT rate"
          value={settings.serbiaVatRate}
          suffix="decimal"
          step={0.01}
          onChange={(serbiaVatRate) =>
            onSettingsChange((current) => ({ ...current, serbiaVatRate }))
          }
        />
        <MetricEditor
          label="AI credits are valid for"
          value={settings.aiCreditExpiresAfterMonths}
          suffix="months"
          step={1}
          onChange={(aiCreditExpiresAfterMonths) =>
            onSettingsChange((current) => ({
              ...current,
              aiCreditExpiresAfterMonths: Math.floor(aiCreditExpiresAfterMonths),
            }))
          }
        />
      </div>

      <AiTiersEditor settings={settings} onSettingsChange={onSettingsChange} />
      <SpecialPricingEditor settings={settings} onSettingsChange={onSettingsChange} />

      <Card>
        <CardHeader>
          <button
            type="button"
            onClick={() => {
              setAdvancedOpen((value) => !value);
              setAdvancedJson(JSON.stringify(settings, null, 2));
            }}
            className="flex items-center justify-between gap-3 text-left"
            aria-expanded={advancedOpen}
          >
            <div className="flex items-center gap-2">
              <FileJson className="h-4 w-4 text-muted-foreground" />
              <div>
                <CardTitle>Advanced fallback JSON</CardTitle>
                <CardDescription>
                  Hidden technical output for rare rules that do not yet have
                  a dedicated visual control.
                </CardDescription>
              </div>
            </div>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")}
            />
          </button>
        </CardHeader>
        <Collapsible open={advancedOpen}>
          <CardContent className="space-y-3 border-t border-border/50 pt-4">
            <Textarea
              value={advancedJson}
              onChange={(event) => setAdvancedJson(event.target.value)}
              rows={14}
              className="font-mono text-xs"
            />
            {advancedError && (
              <p className="text-sm text-destructive">{advancedError}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={applyAdvanced}>
                <Eye className="h-4 w-4" />
                Apply in preview
              </Button>
              <Button type="button" variant="accent" onClick={onSave} disabled={saving}>
                <Save className="h-4 w-4" />
                Save settings
              </Button>
            </div>
          </CardContent>
        </Collapsible>
      </Card>
    </section>
  );
}

function AiTiersEditor({
  settings,
  onSettingsChange,
}: {
  settings: PricingSettings;
  onSettingsChange: (updater: (settings: PricingSettings) => PricingSettings) => void;
}) {
  const tiers = settings.aiCreditTiers;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              AI credit packages
            </CardTitle>
            <CardDescription>
              Each card shows the threshold and an example purchase for that tier.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onSettingsChange((current) => ({
                ...current,
                aiCreditTiers: [
                  ...current.aiCreditTiers,
                  { minCredits: 1, centsPerCredit: 50 },
                ],
              }))
            }
          >
            <Plus className="h-4 w-4" />
            Add package
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {tiers.map((tier, index) => {
          const example = calculateAiCreditPurchase(tier.minCredits, tiers);
          return (
            <div
              key={`${tier.minCredits}-${index}`}
              className="rounded-xl border border-border/45 bg-background/45 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary">{tier.minCredits}+ credits</Badge>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  onClick={() =>
                    onSettingsChange((current) => ({
                      ...current,
                      aiCreditTiers: current.aiCreditTiers.filter((_, i) => i !== index),
                    }))
                  }
                  aria-label="Remove AI tier"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="mt-3 grid gap-2">
                <NumberInput
                  label="Minimum credits"
                  value={tier.minCredits}
                  step={1}
                  min={1}
                  onChange={(minCredits) =>
                    onSettingsChange((current) => ({
                      ...current,
                      aiCreditTiers: current.aiCreditTiers.map((item, i) =>
                        i === index
                          ? { ...item, minCredits: Math.floor(minCredits) }
                          : item,
                      ),
                    }))
                  }
                />
                <NumberInput
                  label="Cents per credit"
                  value={tier.centsPerCredit}
                  step={1}
                  min={1}
                  onChange={(centsPerCredit) =>
                    onSettingsChange((current) => ({
                      ...current,
                      aiCreditTiers: current.aiCreditTiers.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              centsPerCredit: Math.floor(centsPerCredit),
                            }
                          : item,
                      ),
                    }))
                  }
                />
              </div>
              <div className="mt-3 rounded-lg bg-card/70 px-3 py-2 text-xs">
                <PriceRow label="Example total" value={formatEur(example.totalCents / 100)} />
                <PriceRow label="Price/credit" value={formatEur(example.centsPerCredit / 100)} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function SpecialPricingEditor({
  settings,
  onSettingsChange,
}: {
  settings: PricingSettings;
  onSettingsChange: (updater: (settings: PricingSettings) => PricingSettings) => void;
}) {
  const special = settings.specialPricing;
  const setSpecial = (
    updater: (special: PricingSettings["specialPricing"]) => PricingSettings["specialPricing"],
  ) => onSettingsChange((current) => ({ ...current, specialPricing: updater(current.specialPricing) }));

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Interior by floor</CardTitle>
          <CardDescription>First floor, additional floor, and thresholds included in the price.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <SpecialNumber
            label="First floor EUR"
            value={special.interior.firstFloorEur}
            onChange={(firstFloorEur) =>
              setSpecial((current) => ({
                ...current,
                interior: { ...current.interior, firstFloorEur },
              }))
            }
          />
          <SpecialNumber
            label="Additional floor EUR"
            value={special.interior.extraFloorEur}
            onChange={(extraFloorEur) =>
              setSpecial((current) => ({
                ...current,
                interior: { ...current.interior, extraFloorEur },
              }))
            }
          />
          <SpecialNumber
            label="Included rooms"
            value={special.interior.includedRooms}
            step={1}
            onChange={(includedRooms) =>
              setSpecial((current) => ({
                ...current,
                interior: {
                  ...current.interior,
                  includedRooms: Math.floor(includedRooms),
                },
              }))
            }
          />
          <SpecialNumber
            label="Included frames"
            value={special.interior.includedCameras}
            step={1}
            onChange={(includedCameras) =>
              setSpecial((current) => ({
                ...current,
                interior: {
                  ...current.interior,
                  includedCameras: Math.floor(includedCameras),
                },
              }))
            }
          />
          <SpecialNumber
            label="Additional room EUR"
            value={special.interior.extraRoomEur}
            onChange={(extraRoomEur) =>
              setSpecial((current) => ({
                ...current,
                interior: { ...current.interior, extraRoomEur },
              }))
            }
          />
          <SpecialNumber
            label="Additional frame EUR"
            value={special.interior.extraCameraEur}
            onChange={(extraCameraEur) =>
              setSpecial((current) => ({
                ...current,
                interior: { ...current.interior, extraCameraEur },
              }))
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>360 interior</CardTitle>
          <CardDescription>Floors, hotspots, static cameras, and tour assembly.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <SpecialNumber
            label="First floor EUR"
            value={special.tour360.firstFloorEur}
            onChange={(firstFloorEur) =>
              setSpecial((current) => ({
                ...current,
                tour360: { ...current.tour360, firstFloorEur },
              }))
            }
          />
          <SpecialNumber
            label="Additional floor EUR"
            value={special.tour360.extraFloorEur}
            onChange={(extraFloorEur) =>
              setSpecial((current) => ({
                ...current,
                tour360: { ...current.tour360, extraFloorEur },
              }))
            }
          />
          <SpecialNumber
            label="Included hotspots"
            value={special.tour360.includedHotspots}
            step={1}
            onChange={(includedHotspots) =>
              setSpecial((current) => ({
                ...current,
                tour360: {
                  ...current.tour360,
                  includedHotspots: Math.floor(includedHotspots),
                },
              }))
            }
          />
          <SpecialNumber
            label="Included frames"
            value={special.tour360.includedCameras}
            step={1}
            onChange={(includedCameras) =>
              setSpecial((current) => ({
                ...current,
                tour360: {
                  ...current.tour360,
                  includedCameras: Math.floor(includedCameras),
                },
              }))
            }
          />
          <SpecialNumber
            label="Additional hotspot EUR"
            value={special.tour360.extraHotspotEur}
            onChange={(extraHotspotEur) =>
              setSpecial((current) => ({
                ...current,
                tour360: { ...current.tour360, extraHotspotEur },
              }))
            }
          />
          <SpecialNumber
            label="Additional frame EUR"
            value={special.tour360.extraCameraEur}
            onChange={(extraCameraEur) =>
              setSpecial((current) => ({
                ...current,
                tour360: { ...current.tour360, extraCameraEur },
              }))
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tour assembly</CardTitle>
          <CardDescription>Web tour fee, free hotspot threshold, and navigation/branding options.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <SpecialNumber
            label="Base assembly EUR"
            value={special.tourAssembly.baseEur}
            onChange={(baseEur) =>
              setSpecial((current) => ({
                ...current,
                tourAssembly: { ...current.tourAssembly, baseEur },
                tour360: {
                  ...current.tour360,
                  assembly: { ...current.tour360.assembly, baseEur },
                },
              }))
            }
          />
          <SpecialNumber
            label="Free hotspot threshold"
            value={special.tourAssembly.freeHotspotThreshold}
            step={1}
            onChange={(freeHotspotThreshold) =>
              setSpecial((current) => ({
                ...current,
                tourAssembly: {
                  ...current.tourAssembly,
                  freeHotspotThreshold: Math.floor(freeHotspotThreshold),
                },
                tour360: {
                  ...current.tour360,
                  assembly: {
                    ...current.tour360.assembly,
                    freeHotspotThreshold: Math.floor(freeHotspotThreshold),
                  },
                },
              }))
            }
          />
          <SpecialNumber
            label="Floorplan nav EUR"
            value={special.tourAssembly.floorPlanNavEur}
            onChange={(floorPlanNavEur) =>
              setSpecial((current) => ({
                ...current,
                tourAssembly: { ...current.tourAssembly, floorPlanNavEur },
                tour360: {
                  ...current.tour360,
                  assembly: { ...current.tour360.assembly, floorPlanNavEur },
                },
              }))
            }
          />
          <SpecialNumber
            label="White-label EUR"
            value={special.tourAssembly.whiteLabelEur}
            onChange={(whiteLabelEur) =>
              setSpecial((current) => ({
                ...current,
                tourAssembly: { ...current.tourAssembly, whiteLabelEur },
                tour360: {
                  ...current.tour360,
                  assembly: { ...current.tour360.assembly, whiteLabelEur },
                },
              }))
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function IncludesEditor({
  includes,
  onChange,
}: {
  includes: string[];
  onChange: (includes: string[]) => void;
}) {
  return (
    <div>
      <Label className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
        What is included
      </Label>
      <Textarea
        value={includes.join("\n")}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(/\r?\n/)
              .map((item) => item.trim())
              .filter(Boolean),
          )
        }
        rows={3}
        className="mt-2"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {includes.map((item) => (
          <Badge key={item} variant="secondary">
            <Check className="h-3 w-3" />
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function DurationTiersEditor({
  tiers,
  onChange,
}: {
  tiers: DurationConfig["discountTiers"];
  onChange: (tiers: DurationConfig["discountTiers"]) => void;
}) {
  const normalizedMax = (value: number) =>
    Number.isFinite(value) ? value : 240;
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-foreground">
            Duration discounts
          </p>
          <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
            Rules are read in order: minimum seconds, maximum seconds, percentage.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() =>
            onChange([
              ...tiers,
              { minSec: 60, maxSec: 120, discountPct: 5 },
            ])
          }
        >
          <Plus className="h-3 w-3" />
          Discount
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        {tiers.map((tier, index) => (
          <div
            key={`${tier.minSec}-${index}`}
            className="grid items-end gap-2 rounded-lg bg-background/50 p-2 md:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <NumberInput
              label="Min sec"
              value={tier.minSec}
              step={1}
              min={1}
              onChange={(minSec) =>
                onChange(
                  tiers.map((item, i) =>
                    i === index ? { ...item, minSec: Math.floor(minSec) } : item,
                  ),
                )
              }
            />
            <NumberInput
              label="Max sec"
              value={normalizedMax(tier.maxSec)}
              step={1}
              min={1}
              onChange={(maxSec) =>
                onChange(
                  tiers.map((item, i) =>
                    i === index ? { ...item, maxSec: Math.floor(maxSec) } : item,
                  ),
                )
              }
            />
            <NumberInput
              label="Discount %"
              value={tier.discountPct}
              step={1}
              min={0}
              max={100}
              onChange={(discountPct) =>
                onChange(
                  tiers.map((item, i) =>
                    i === index
                      ? { ...item, discountPct: Math.round(discountPct) }
                      : item,
                  ),
                )
              }
            />
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              onClick={() => onChange(tiers.filter((_, i) => i !== index))}
              aria-label="Remove duration discount"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricEditor({
  label,
  value,
  suffix,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-[0.72rem] font-semibold uppercase tracking-[0.18em]">
          {label}
        </CardDescription>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step={step}
            value={value}
            onChange={(event) => onChange(numberFromInput(event.target.value))}
            className="h-11 text-lg font-semibold tabular-nums"
          />
          <span className="text-xs text-muted-foreground">{suffix}</span>
        </div>
      </CardHeader>
    </Card>
  );
}

function SpecialNumber({
  label,
  value,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <NumberInput label={label} value={value} step={step} min={0} onChange={onChange} />
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </Label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2"
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  step = 0.01,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <Label className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </Label>
      <Input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        step={step}
        min={min}
        max={max}
        onChange={(event) => onChange(numberFromInput(event.target.value))}
        className="mt-2 tabular-nums"
      />
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  label,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (value: number) => void;
}) {
  const clamped = (next: number) => Math.max(min, Math.min(max, Math.floor(next)));
  return (
    <div className="flex items-center rounded-lg border border-border/60 bg-background/60">
      <button
        type="button"
        onClick={() => onChange(clamped(value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
        className="flex h-8 w-8 items-center justify-center rounded-l-lg transition-colors hover:bg-muted disabled:opacity-30"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-10 text-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(clamped(value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
        className="flex h-8 w-8 items-center justify-center rounded-r-lg transition-colors hover:bg-muted disabled:opacity-30"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MiniProductPreview({
  total,
  original,
  label,
}: {
  total: number;
  original: number;
  label: string;
}) {
  const hasDiscount = original > total;
  return (
    <div className="w-full rounded-xl border border-accent/25 bg-accent/10 p-4 xl:w-56">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-2 xl:block">
        {hasDiscount && (
          <p className="text-sm text-muted-foreground line-through tabular-nums">
            {formatEur(original)}
          </p>
        )}
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {formatEur(total)}
        </p>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof PackageCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 text-accent" />
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function PriceRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "flex-shrink-0 tabular-nums",
          strong ? "font-bold text-foreground" : "font-semibold text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function makePreviewItem(
  categoryId: string,
  product: ConfiguratorProduct,
  quantities: Record<string, number>,
  seconds: number,
): QuoteItem {
  const addOnQuantities = Object.fromEntries(
    product.addOns.map((addOn) => [
      addOn.id,
      quantities[addOn.id] ?? addOn.includedQty,
    ]),
  );
  const base: QuoteItem = {
    instanceId: `preview-${product.id}`,
    categoryId,
    productId: product.id,
    addOnQuantities,
  };
  if (product.durationConfig) {
    base.durationSeconds = Math.max(product.durationConfig.minSeconds, seconds);
  }
  if (product.id === "int-static") {
    base.interiorConfig = [
      {
        id: "preview-floor-1",
        name: "Floor 1",
        rooms: [],
        description: "",
      },
    ];
  }
  if (product.id === "int-360") {
    base.tour360Config = {
      floors: [
        {
          id: "preview-tour-floor-1",
          name: "Floor 1",
          rooms: [],
          description: "",
        },
      ],
      tourAssembly: defaultTourAssembly(),
    };
  }
  if (product.id === AI_CREDIT_PRODUCT_ID) {
    base.categoryId = AI_CREDIT_CATEGORY_ID;
    base.aiCreditQuantity = 25;
  }
  return base;
}

function unitPriceForQuantity(addOn: ConfiguratorAddOn, quantity: number) {
  let unitPrice = addOn.priceEur;
  for (const rule of addOn.volumeRules) {
    if (quantity > rule.afterQty) unitPrice = rule.priceEur;
  }
  return unitPrice;
}

function durationDiscountPct(config: DurationConfig, seconds: number) {
  const tier = config.discountTiers.find(
    (item) => seconds >= item.minSec && seconds <= item.maxSec,
  );
  return tier?.discountPct ?? 0;
}

function numberFromInput(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
