"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin-auth";
import { priceItems, type QuoteItem } from "@/lib/catalog/calculate";
import type {
  ConfiguratorAddOn,
  ConfiguratorCategory,
  ConfiguratorProduct,
  ConsumeRule,
  DurationConfig,
  VolumeRule,
} from "@/lib/catalog/configurator";
import {
  clonePublishedPricingToDraft as clonePublishedPricingToDraftBook,
  getDraftPricingCatalog,
  publishDraftPricingBook,
  updatePricingDraft,
} from "@/server/pricing/catalog";
import type { PricingSettings } from "@/lib/pricing/catalog";

type FinanceAdmin = {
  id: string;
};

export type PricingDraftVisualPatch =
  | {
      kind: "product";
      productId: string;
      label: string;
      unitLabel: string;
      basePriceRsd: number;
      includes: string[];
      inquiryOnly: boolean;
    }
  | {
      kind: "addon";
      productId: string;
      addOnId: string;
      label: string;
      description: string;
      priceRsd: number;
      includedQty: number;
      maxQty: number | null;
      volumeRules: VolumeRule[];
    }
  | {
      kind: "discount";
      productId: string;
      ruleIndex: number;
      discountPct: number;
      reason: string;
    }
  | {
      kind: "duration";
      productId: string;
      sourceMode: string | null;
      minSeconds: number;
      defaultSeconds: number;
      maxSeconds: number | null;
      perSecondRsd: number;
      discountTiers: DurationConfig["discountTiers"];
    }
  | {
      kind: "settings";
      settings: PricingSettings;
    };

export async function requireFinanceAdmin(): Promise<FinanceAdmin> {
  return requirePermission("FINANCE_MANAGE");
}

export async function savePricingDraftChange(formData: FormData) {
  const admin = await requireFinanceAdmin();
  const kind = text(formData, "kind");

  await updatePricingDraft(
    admin.id,
    (categories, settings) => {
      if (kind === "product") {
        return {
          categories: updateProduct(categories, text(formData, "productId"), {
            label: text(formData, "label"),
            unitLabel: text(formData, "unitLabel"),
            basePriceRsd: numberValue(formData, "basePriceRsd"),
            includes: lines(text(formData, "includes")),
            inquiryOnly: boolValue(formData, "inquiryOnly"),
          }),
          settings,
        };
      }

      if (kind === "addon") {
        return {
          categories: updateAddOn(
            categories,
            text(formData, "productId"),
            text(formData, "addOnId"),
            {
              label: text(formData, "label"),
              description: text(formData, "description"),
              priceRsd: numberValue(formData, "priceRsd"),
              includedQty: intValue(formData, "includedQty"),
              maxQty: nullableIntValue(formData, "maxQty"),
              volumeRules: jsonValue<VolumeRule[]>(
                text(formData, "volumeRulesJson"),
                [],
              ),
            },
          ),
          settings,
        };
      }

      if (kind === "discount") {
        return {
          categories: updateDiscountRule(
            categories,
            text(formData, "productId"),
            intValue(formData, "ruleIndex"),
            {
              discountPct: intValue(formData, "discountPct"),
              reason: text(formData, "reason"),
            },
          ),
          settings,
        };
      }

      if (kind === "duration") {
        return {
          categories: updateDurationRule(
            categories,
            text(formData, "productId"),
            nullableText(formData, "sourceMode"),
            {
              minSeconds: intValue(formData, "minSeconds"),
              defaultSeconds: intValue(formData, "defaultSeconds"),
              maxSeconds: nullableIntValue(formData, "maxSeconds"),
              perSecondRsd: numberValue(formData, "perSecondRsd"),
              discountTiers: jsonValue<DurationConfig["discountTiers"]>(
                text(formData, "discountTiersJson"),
                [],
              ),
            },
          ),
          settings,
        };
      }

      if (kind === "settings") {
        return {
          categories,
          settings: updateSettings(settings, formData),
        };
      }

      throw new Error("Nepoznata izmena cenovnika.");
    },
    {
      kind,
      productId: nullableText(formData, "productId"),
      addOnId: nullableText(formData, "addOnId"),
    },
  );

  revalidateFinancePaths();
}

export async function savePricingDraftVisualPatch(
  patch: PricingDraftVisualPatch,
) {
  const admin = await requireFinanceAdmin();
  const normalized = normalizeVisualPatch(patch);

  const draft = await updatePricingDraft(
    admin.id,
    (categories, settings) => {
      if (normalized.kind === "product") {
        return {
          categories: updateProduct(categories, normalized.productId, {
            label: normalized.label,
            unitLabel: normalized.unitLabel,
            basePriceRsd: normalized.basePriceRsd,
            includes: normalized.includes,
            inquiryOnly: normalized.inquiryOnly,
          }),
          settings,
        };
      }

      if (normalized.kind === "addon") {
        return {
          categories: updateAddOn(
            categories,
            normalized.productId,
            normalized.addOnId,
            {
              label: normalized.label,
              description: normalized.description,
              priceRsd: normalized.priceRsd,
              includedQty: normalized.includedQty,
              maxQty: normalized.maxQty,
              volumeRules: normalized.volumeRules,
            },
          ),
          settings,
        };
      }

      if (normalized.kind === "discount") {
        return {
          categories: updateDiscountRule(
            categories,
            normalized.productId,
            normalized.ruleIndex,
            {
              discountPct: normalized.discountPct,
              reason: normalized.reason,
            },
          ),
          settings,
        };
      }

      if (normalized.kind === "duration") {
        return {
          categories: updateDurationRule(
            categories,
            normalized.productId,
            normalized.sourceMode,
            {
              minSeconds: normalized.minSeconds,
              defaultSeconds: normalized.defaultSeconds,
              maxSeconds: normalized.maxSeconds,
              perSecondRsd: normalized.perSecondRsd,
              discountTiers: normalized.discountTiers,
            },
          ),
          settings,
        };
      }

      return {
        categories,
        settings: normalized.settings,
      };
    },
    {
      kind: normalized.kind,
      productId: "productId" in normalized ? normalized.productId : null,
      addOnId: "addOnId" in normalized ? normalized.addOnId : null,
      source: "visual_workbench",
    },
  );

  revalidateFinancePaths();
  return draft;
}

export async function publishPricingBook() {
  const admin = await requireFinanceAdmin();
  await publishDraftPricingBook(admin.id);
  revalidateFinancePaths();
}

export async function clonePublishedPricingToDraft() {
  const admin = await requireFinanceAdmin();
  await clonePublishedPricingToDraftBook(admin.id);
  revalidatePath("/portal/admin/finansije/cenovnik");
}

export async function previewPricingQuote(items: QuoteItem[]) {
  await requireFinanceAdmin();
  const draft = await getDraftPricingCatalog();
  return priceItems(items, [], draft);
}

function revalidateFinancePaths() {
  revalidatePath("/portal/admin/finansije/cenovnik");
  revalidatePath("/cene");
  revalidatePath("/poruci");
  revalidatePath("/portal/nova-porudzbina");
}

function updateProduct(
  categories: ConfiguratorCategory[],
  productId: string,
  patch: Pick<
    ConfiguratorProduct,
    "label" | "unitLabel" | "basePriceRsd" | "includes" | "inquiryOnly"
  >,
): ConfiguratorCategory[] {
  return categories.map((category) => ({
    ...category,
    products: category.products.map((product) =>
      product.id === productId ? { ...product, ...patch } : product,
    ),
  }));
}

function updateAddOn(
  categories: ConfiguratorCategory[],
  productId: string,
  addOnId: string,
  patch: Pick<
    ConfiguratorAddOn,
    "label" | "description" | "priceRsd" | "includedQty" | "volumeRules"
  > & { maxQty: number | null },
): ConfiguratorCategory[] {
  return categories.map((category) => ({
    ...category,
    products: category.products.map((product) => {
      if (product.id !== productId) return product;
      return {
        ...product,
        addOns: product.addOns.map((addOn) =>
          addOn.id === addOnId
            ? { ...addOn, ...patch, maxQty: patch.maxQty ?? Infinity }
            : addOn,
        ),
      };
    }),
  }));
}

function updateDiscountRule(
  categories: ConfiguratorCategory[],
  productId: string,
  ruleIndex: number,
  patch: Pick<ConsumeRule, "discountPct" | "reason">,
): ConfiguratorCategory[] {
  return categories.map((category) => ({
    ...category,
    products: category.products.map((product) => {
      if (product.id !== productId || !product.consumes) return product;
      return {
        ...product,
        consumes: product.consumes.map((rule, index) =>
          index === ruleIndex ? { ...rule, ...patch } : rule,
        ),
      };
    }),
  }));
}

function updateDurationRule(
  categories: ConfiguratorCategory[],
  productId: string,
  sourceMode: string | null,
  patch: Omit<DurationConfig, "maxSeconds"> & { maxSeconds: number | null },
): ConfiguratorCategory[] {
  return categories.map((category) => ({
    ...category,
    products: category.products.map((product) => {
      if (product.id !== productId || !product.durationConfig) return product;
      if (sourceMode) {
        return {
          ...product,
          sourceModeRules: {
            ...product.sourceModeRules,
            [sourceMode]: {
              ...(product.sourceModeRules?.[sourceMode] ?? {}),
              perSecondRsd: patch.perSecondRsd,
            },
          },
        };
      }
      return {
        ...product,
        durationConfig: {
          minSeconds: patch.minSeconds,
          defaultSeconds: patch.defaultSeconds,
          maxSeconds: patch.maxSeconds ?? Infinity,
          perSecondRsd: patch.perSecondRsd,
          discountTiers: patch.discountTiers,
        },
      };
    }),
  }));
}

function updateSettings(
  settings: PricingSettings,
  formData: FormData,
): PricingSettings {
  return {
    ...settings,
    rsdRate: numberValue(formData, "rsdRate"),
    serbiaVatRate: numberValue(formData, "serbiaVatRate"),
    aiCreditExpiresAfterMonths: intValue(
      formData,
      "aiCreditExpiresAfterMonths",
    ),
    aiCreditTiers: jsonValue(
      text(formData, "aiCreditTiersJson"),
      settings.aiCreditTiers,
    ),
    specialPricing: jsonValue(
      text(formData, "specialPricingJson"),
      settings.specialPricing,
    ),
  };
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value || null;
}

function boolValue(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function numberValue(formData: FormData, key: string): number {
  const parsed = Number(text(formData, key).replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Neispravna numerička vrednost: ${key}`);
  }
  return parsed;
}

function intValue(formData: FormData, key: string): number {
  return Math.floor(numberValue(formData, key));
}

function nullableIntValue(formData: FormData, key: string): number | null {
  const value = text(formData, key);
  if (!value) return null;
  return Math.floor(numberValue(formData, key));
}

function lines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function jsonValue<T>(raw: string, fallback: T): T {
  if (!raw.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("JSON podešavanje nije ispravno.");
  }
}

function normalizeVisualPatch(
  patch: PricingDraftVisualPatch,
): PricingDraftVisualPatch {
  if (patch.kind === "product") {
    return {
      kind: "product",
      productId: requiredText(patch.productId, "productId"),
      label: requiredText(patch.label, "Naziv"),
      unitLabel: requiredText(patch.unitLabel, "Unit label"),
      basePriceRsd: positiveNumber(patch.basePriceRsd, "Osnovna cena"),
      includes: patch.includes
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 12),
      inquiryOnly: Boolean(patch.inquiryOnly),
    };
  }

  if (patch.kind === "addon") {
    return {
      kind: "addon",
      productId: requiredText(patch.productId, "productId"),
      addOnId: requiredText(patch.addOnId, "addOnId"),
      label: requiredText(patch.label, "Naziv dodatka"),
      description: patch.description.trim(),
      priceRsd: nonNegativeNumber(patch.priceRsd, "Cena dodatka"),
      includedQty: nonNegativeInteger(patch.includedQty, "Uključeno"),
      maxQty:
        patch.maxQty === null
          ? null
          : positiveInteger(patch.maxQty, "Maksimalna količina"),
      volumeRules: normalizeVolumeRules(patch.volumeRules),
    };
  }

  if (patch.kind === "discount") {
    return {
      kind: "discount",
      productId: requiredText(patch.productId, "productId"),
      ruleIndex: nonNegativeInteger(patch.ruleIndex, "Indeks popusta"),
      discountPct: percent(patch.discountPct, "Popust"),
      reason: requiredText(patch.reason, "Razlog popusta"),
    };
  }

  if (patch.kind === "duration") {
    const minSeconds = positiveInteger(patch.minSeconds, "Minimum sekundi");
    const defaultSeconds = positiveInteger(
      patch.defaultSeconds,
      "Default sekundi",
    );
    const maxSeconds =
      patch.maxSeconds === null
        ? null
        : positiveInteger(patch.maxSeconds, "Maksimum sekundi");
    if (defaultSeconds < minSeconds) {
      throw new Error("Default trajanje ne može biti manje od minimuma.");
    }
    if (maxSeconds !== null && maxSeconds < defaultSeconds) {
      throw new Error("Maksimum trajanja ne može biti manji od default trajanja.");
    }
    return {
      kind: "duration",
      productId: requiredText(patch.productId, "productId"),
      sourceMode: patch.sourceMode ? patch.sourceMode.trim() : null,
      minSeconds,
      defaultSeconds,
      maxSeconds,
      perSecondRsd: positiveNumber(patch.perSecondRsd, "Cena po sekundi"),
      discountTiers: normalizeDurationTiers(patch.discountTiers),
    };
  }

  return {
    kind: "settings",
    settings: normalizeSettingsPatch(patch.settings),
  };
}

function normalizeSettingsPatch(settings: PricingSettings): PricingSettings {
  return {
    rsdRate: positiveNumber(settings.rsdRate, "RSD kurs"),
    serbiaVatRate: percentRatio(settings.serbiaVatRate, "PDV Srbija"),
    aiCreditUnitsPerCredit: positiveInteger(
      settings.aiCreditUnitsPerCredit,
      "AI jedinice po kreditu",
    ),
    aiCreditExpiresAfterMonths: positiveInteger(
      settings.aiCreditExpiresAfterMonths,
      "AI expiry meseci",
    ),
    aiCreditTiers: settings.aiCreditTiers
      .map((tier) => ({
        minCredits: positiveInteger(tier.minCredits, "Minimum kredita"),
        centsPerCredit: positiveInteger(
          tier.centsPerCredit,
          "Cena po kreditu u centima",
        ),
      }))
      .sort((a, b) => b.minCredits - a.minCredits),
    specialPricing: {
      interior: {
        firstFloorRsd: positiveNumber(
          settings.specialPricing.interior.firstFloorRsd,
          "Enterijer prvi sprat",
        ),
        extraFloorRsd: positiveNumber(
          settings.specialPricing.interior.extraFloorRsd,
          "Enterijer dodatni sprat",
        ),
        includedRooms: nonNegativeInteger(
          settings.specialPricing.interior.includedRooms,
          "Enterijer uključene prostorije",
        ),
        includedCameras: nonNegativeInteger(
          settings.specialPricing.interior.includedCameras,
          "Enterijer uključeni kadrovi",
        ),
        extraRoomRsd: positiveNumber(
          settings.specialPricing.interior.extraRoomRsd,
          "Enterijer doplata prostorije",
        ),
        extraCameraRsd: positiveNumber(
          settings.specialPricing.interior.extraCameraRsd,
          "Enterijer doplata kadra",
        ),
      },
      tour360: {
        firstFloorRsd: positiveNumber(
          settings.specialPricing.tour360.firstFloorRsd,
          "360 prvi sprat",
        ),
        extraFloorRsd: positiveNumber(
          settings.specialPricing.tour360.extraFloorRsd,
          "360 dodatni sprat",
        ),
        includedHotspots: nonNegativeInteger(
          settings.specialPricing.tour360.includedHotspots,
          "360 uključeni hotspotovi",
        ),
        includedCameras: nonNegativeInteger(
          settings.specialPricing.tour360.includedCameras,
          "360 uključeni kadrovi",
        ),
        extraHotspotRsd: positiveNumber(
          settings.specialPricing.tour360.extraHotspotRsd,
          "360 doplata hotspota",
        ),
        extraCameraRsd: positiveNumber(
          settings.specialPricing.tour360.extraCameraRsd,
          "360 doplata kadra",
        ),
        assembly: {
          baseRsd: nonNegativeNumber(
            settings.specialPricing.tour360.assembly.baseRsd,
            "Tour assembly baza",
          ),
          freeHotspotThreshold: nonNegativeInteger(
            settings.specialPricing.tour360.assembly.freeHotspotThreshold,
            "Tour assembly free hotspot prag",
          ),
          floorPlanNavRsd: nonNegativeNumber(
            settings.specialPricing.tour360.assembly.floorPlanNavRsd,
            "Tour floorplan navigacija",
          ),
          whiteLabelRsd: nonNegativeNumber(
            settings.specialPricing.tour360.assembly.whiteLabelRsd,
            "Tour white-label",
          ),
        },
      },
      tourAssembly: {
        baseRsd: nonNegativeNumber(
          settings.specialPricing.tourAssembly.baseRsd,
          "Tour assembly baza",
        ),
        freeHotspotThreshold: nonNegativeInteger(
          settings.specialPricing.tourAssembly.freeHotspotThreshold,
          "Tour assembly free hotspot prag",
        ),
        floorPlanNavRsd: nonNegativeNumber(
          settings.specialPricing.tourAssembly.floorPlanNavRsd,
          "Tour floorplan navigacija",
        ),
        whiteLabelRsd: nonNegativeNumber(
          settings.specialPricing.tourAssembly.whiteLabelRsd,
          "Tour white-label",
        ),
      },
    },
  };
}

function normalizeVolumeRules(rules: VolumeRule[]): VolumeRule[] {
  return rules
    .map((rule) => ({
      afterQty: nonNegativeInteger(rule.afterQty, "Volume prag"),
      priceRsd: nonNegativeNumber(rule.priceRsd, "Volume cena"),
    }))
    .sort((a, b) => a.afterQty - b.afterQty);
}

function normalizeDurationTiers(
  tiers: DurationConfig["discountTiers"],
): DurationConfig["discountTiers"] {
  return tiers
    .map((tier) => ({
      minSec: positiveInteger(tier.minSec, "Duration min"),
      maxSec:
        tier.maxSec === null || tier.maxSec === undefined
          ? Infinity
          : positiveInteger(tier.maxSec, "Duration max"),
      discountPct: percent(tier.discountPct, "Duration popust"),
    }))
    .sort((a, b) => a.minSec - b.minSec);
}

function requiredText(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} je obavezno polje.`);
  return trimmed;
}

function nonNegativeNumber(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} mora biti 0 ili veće.`);
  }
  return value;
}

function positiveNumber(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} mora biti veće od nule.`);
  }
  return value;
}

function nonNegativeInteger(value: number, label: string): number {
  return Math.floor(nonNegativeNumber(value, label));
}

function positiveInteger(value: number, label: string): number {
  return Math.floor(positiveNumber(value, label));
}

function percent(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${label} mora biti između 0 i 100.`);
  }
  return Math.round(value);
}

function percentRatio(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} mora biti decimalno između 0 i 1.`);
  }
  return value;
}
