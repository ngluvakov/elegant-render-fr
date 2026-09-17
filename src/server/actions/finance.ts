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
      basePriceEur: number;
      includes: string[];
      inquiryOnly: boolean;
    }
  | {
      kind: "addon";
      productId: string;
      addOnId: string;
      label: string;
      description: string;
      priceEur: number;
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
      perSecondEur: number;
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
            basePriceEur: numberValue(formData, "basePriceEur"),
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
              priceEur: numberValue(formData, "priceEur"),
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
              perSecondEur: numberValue(formData, "perSecondEur"),
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

      throw new Error("Unknown pricing change.");
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
            basePriceEur: normalized.basePriceEur,
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
              priceEur: normalized.priceEur,
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
              perSecondEur: normalized.perSecondEur,
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
  revalidatePath("/portal/admin/finance/pricebook");
}

export async function previewPricingQuote(items: QuoteItem[]) {
  await requireFinanceAdmin();
  const draft = await getDraftPricingCatalog();
  return priceItems(items, [], draft);
}

function revalidateFinancePaths() {
  revalidatePath("/portal/admin/finance/pricebook");
  revalidatePath("/tarifs");
  revalidatePath("/commande");
  revalidatePath("/portal/new-order");
}

function updateProduct(
  categories: ConfiguratorCategory[],
  productId: string,
  patch: Pick<
    ConfiguratorProduct,
    "label" | "unitLabel" | "basePriceEur" | "includes" | "inquiryOnly"
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
    "label" | "description" | "priceEur" | "includedQty" | "volumeRules"
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
              perSecondEur: patch.perSecondEur,
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
          perSecondEur: patch.perSecondEur,
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
    throw new Error(`Valeur numérique invalide : ${key}`);
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
    throw new Error("Le paramètre JSON n’est pas valide.");
  }
}

function normalizeVisualPatch(
  patch: PricingDraftVisualPatch,
): PricingDraftVisualPatch {
  if (patch.kind === "product") {
    return {
      kind: "product",
      productId: requiredText(patch.productId, "productId"),
      label: requiredText(patch.label, "Nom"),
      unitLabel: requiredText(patch.unitLabel, "Libellé d’unité"),
      basePriceEur: positiveNumber(patch.basePriceEur, "Prix de base"),
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
      label: requiredText(patch.label, "Nom de l’option"),
      description: patch.description.trim(),
      priceEur: nonNegativeNumber(patch.priceEur, "Prix de l’option"),
      includedQty: nonNegativeInteger(patch.includedQty, "Quantité incluse"),
      maxQty:
        patch.maxQty === null
          ? null
          : positiveInteger(patch.maxQty, "Quantité maximale"),
      volumeRules: normalizeVolumeRules(patch.volumeRules),
    };
  }

  if (patch.kind === "discount") {
    return {
      kind: "discount",
      productId: requiredText(patch.productId, "productId"),
      ruleIndex: nonNegativeInteger(patch.ruleIndex, "Indice de la règle de remise"),
      discountPct: percent(patch.discountPct, "Remise"),
      reason: requiredText(patch.reason, "Motif de la remise"),
    };
  }

  if (patch.kind === "duration") {
    const minSeconds = positiveInteger(patch.minSeconds, "Durée minimale en secondes");
    const defaultSeconds = positiveInteger(
      patch.defaultSeconds,
      "Durée par défaut en secondes",
    );
    const maxSeconds =
      patch.maxSeconds === null
        ? null
        : positiveInteger(patch.maxSeconds, "Durée maximale en secondes");
    if (defaultSeconds < minSeconds) {
      throw new Error("La durée par défaut ne peut pas être inférieure à la durée minimale.");
    }
    if (maxSeconds !== null && maxSeconds < defaultSeconds) {
      throw new Error("La durée maximale ne peut pas être inférieure à la durée par défaut.");
    }
    return {
      kind: "duration",
      productId: requiredText(patch.productId, "productId"),
      sourceMode: patch.sourceMode ? patch.sourceMode.trim() : null,
      minSeconds,
      defaultSeconds,
      maxSeconds,
      perSecondEur: positiveNumber(patch.perSecondEur, "Prix par seconde"),
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
    serbiaVatRate: percentRatio(settings.serbiaVatRate, "Taux de TVA serbe"),
    aiCreditUnitsPerCredit: positiveInteger(
      settings.aiCreditUnitsPerCredit,
      "Unités IA par crédit",
    ),
    aiCreditExpiresAfterMonths: positiveInteger(
      settings.aiCreditExpiresAfterMonths,
      "Mois avant expiration des crédits IA",
    ),
    aiCreditTiers: settings.aiCreditTiers
      .map((tier) => ({
        minCredits: positiveInteger(tier.minCredits, "Nombre minimal de crédits"),
        centsPerCredit: positiveInteger(
          tier.centsPerCredit,
          "Prix par crédit en centimes",
        ),
      }))
      .sort((a, b) => b.minCredits - a.minCredits),
    specialPricing: {
      interior: {
        firstFloorEur: positiveNumber(
          settings.specialPricing.interior.firstFloorEur,
          "Intérieur — premier niveau",
        ),
        extraFloorEur: positiveNumber(
          settings.specialPricing.interior.extraFloorEur,
          "Intérieur — niveau supplémentaire",
        ),
        includedRooms: nonNegativeInteger(
          settings.specialPricing.interior.includedRooms,
          "Intérieur — pièces incluses",
        ),
        includedCameras: nonNegativeInteger(
          settings.specialPricing.interior.includedCameras,
          "Intérieur — caméras incluses",
        ),
        extraRoomEur: positiveNumber(
          settings.specialPricing.interior.extraRoomEur,
          "Intérieur — supplément par pièce",
        ),
        extraCameraEur: positiveNumber(
          settings.specialPricing.interior.extraCameraEur,
          "Intérieur — supplément par caméra",
        ),
      },
      tour360: {
        firstFloorEur: positiveNumber(
          settings.specialPricing.tour360.firstFloorEur,
          "360 — premier niveau",
        ),
        extraFloorEur: positiveNumber(
          settings.specialPricing.tour360.extraFloorEur,
          "360 — niveau supplémentaire",
        ),
        includedHotspots: nonNegativeInteger(
          settings.specialPricing.tour360.includedHotspots,
          "360 — hotspots inclus",
        ),
        includedCameras: nonNegativeInteger(
          settings.specialPricing.tour360.includedCameras,
          "360 — caméras incluses",
        ),
        extraHotspotEur: positiveNumber(
          settings.specialPricing.tour360.extraHotspotEur,
          "360 — supplément par hotspot",
        ),
        extraCameraEur: positiveNumber(
          settings.specialPricing.tour360.extraCameraEur,
          "360 — supplément par caméra",
        ),
        assembly: {
          baseEur: nonNegativeNumber(
            settings.specialPricing.tour360.assembly.baseEur,
            "Assemblage de la visite — base",
          ),
          freeHotspotThreshold: nonNegativeInteger(
            settings.specialPricing.tour360.assembly.freeHotspotThreshold,
            "Assemblage de la visite — seuil de hotspots gratuits",
          ),
          floorPlanNavEur: nonNegativeNumber(
            settings.specialPricing.tour360.assembly.floorPlanNavEur,
            "Visite — navigation par plan",
          ),
          whiteLabelEur: nonNegativeNumber(
            settings.specialPricing.tour360.assembly.whiteLabelEur,
            "Visite — marque blanche",
          ),
        },
      },
      tourAssembly: {
        baseEur: nonNegativeNumber(
          settings.specialPricing.tourAssembly.baseEur,
          "Assemblage de la visite — base",
        ),
        freeHotspotThreshold: nonNegativeInteger(
          settings.specialPricing.tourAssembly.freeHotspotThreshold,
          "Assemblage de la visite — seuil de hotspots gratuits",
        ),
        floorPlanNavEur: nonNegativeNumber(
          settings.specialPricing.tourAssembly.floorPlanNavEur,
          "Visite — navigation par plan",
        ),
        whiteLabelEur: nonNegativeNumber(
          settings.specialPricing.tourAssembly.whiteLabelEur,
          "Visite — marque blanche",
        ),
      },
    },
  };
}

function normalizeVolumeRules(rules: VolumeRule[]): VolumeRule[] {
  return rules
    .map((rule) => ({
      afterQty: nonNegativeInteger(rule.afterQty, "Seuil de volume"),
      priceEur: nonNegativeNumber(rule.priceEur, "Prix de volume"),
    }))
    .sort((a, b) => a.afterQty - b.afterQty);
}

function normalizeDurationTiers(
  tiers: DurationConfig["discountTiers"],
): DurationConfig["discountTiers"] {
  return tiers
    .map((tier) => ({
      minSec: positiveInteger(tier.minSec, "Durée min"),
      maxSec:
        tier.maxSec === null || tier.maxSec === undefined
          ? Infinity
          : positiveInteger(tier.maxSec, "Durée max"),
      discountPct: percent(tier.discountPct, "Remise sur la durée"),
    }))
    .sort((a, b) => a.minSec - b.minSec);
}

function requiredText(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`Le champ « ${label} » est obligatoire.`);
  return trimmed;
}

function nonNegativeNumber(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`La valeur « ${label} » doit être supérieure ou égale à 0.`);
  }
  return value;
}

function positiveNumber(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`La valeur « ${label} » doit être supérieure à zéro.`);
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
    throw new Error(`La valeur « ${label} » doit être comprise entre 0 et 100.`);
  }
  return Math.round(value);
}

function percentRatio(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`La valeur « ${label} » doit être un nombre décimal compris entre 0 et 1.`);
  }
  return value;
}
