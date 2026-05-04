"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
  isAdmin: boolean;
  canManageFinance: boolean;
};

export async function requireFinanceAdmin(): Promise<FinanceAdmin> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isAdmin: true, canManageFinance: true },
  });
  if (!user?.isAdmin || !user.canManageFinance) {
    throw new Error("Finance admin required");
  }
  return user;
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

export async function saveUserFinanceAccess(formData: FormData) {
  await requireFinanceAdmin();
  const userId = text(formData, "userId");
  if (!userId) throw new Error("Korisnik nije pronađen.");
  const isAdmin = boolValue(formData, "isAdmin");
  const canManageFinance = isAdmin && boolValue(formData, "canManageFinance");

  await prisma.user.update({
    where: { id: userId },
    data: {
      isAdmin,
      canManageFinance,
    },
  });
  revalidatePath("/portal/admin/korisnici");
  revalidatePath(`/portal/admin/korisnici/${userId}`);
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
    eurToRsdRate: numberValue(formData, "eurToRsdRate"),
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
