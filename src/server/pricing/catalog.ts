import { cache } from "react";
import { prisma } from "@/lib/db";
import {
  DEFAULT_PRICING_SETTINGS,
  decodePricingCatalog,
  encodePricingCatalog,
  getStaticPricingCatalog,
  normalizePricingSettings,
  type PricingSettings,
  type ResolvedPricingCatalog,
} from "@/lib/pricing/catalog";
import type {
  ConfiguratorCategory,
  ConfiguratorProduct,
} from "@/lib/catalog/configurator";
import { Prisma } from "@/generated/prisma/client";

type PricingBookRow = {
  id: string;
  name: string;
  status: "draft" | "published" | "archived";
  catalogJson: Prisma.JsonValue;
  settingsJson: Prisma.JsonValue;
  publishedAt: Date | null;
  updatedAt: Date;
};

function toCatalog(book: PricingBookRow): ResolvedPricingCatalog {
  return {
    bookId: book.id,
    name: book.name,
    status: book.status === "published" ? "published" : "draft",
    publishedAt: book.publishedAt?.toISOString() ?? null,
    updatedAt: book.updatedAt.toISOString(),
    categories: decodePricingCatalog(book.catalogJson),
    settings: normalizePricingSettings(book.settingsJson),
  };
}

function staticPayload() {
  const catalog = getStaticPricingCatalog();
  return {
    catalogJson: encodePricingCatalog(catalog.categories) as Prisma.InputJsonValue,
    settingsJson: catalog.settings as unknown as Prisma.InputJsonValue,
  };
}

export const getPublishedPricingCatalog = cache(async function getPublishedPricingCatalog(): Promise<ResolvedPricingCatalog> {
  try {
    if (!prisma.pricingBook) return getStaticPricingCatalog();

    const book = await prisma.pricingBook.findFirst({
      where: { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        status: true,
        catalogJson: true,
        settingsJson: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    return book ? toCatalog(book as PricingBookRow) : getStaticPricingCatalog();
  } catch (error) {
    if (isMissingPricingTableError(error)) return getStaticPricingCatalog();
    throw error;
  }
});

export const getPublishedPricingBook = getPublishedPricingCatalog;

export async function resolvePricingCatalog(
  pricingBookId: string | null | undefined,
): Promise<ResolvedPricingCatalog> {
  if (!pricingBookId) return getPublishedPricingCatalog();
  try {
    if (!prisma.pricingBook) return getStaticPricingCatalog();

    const book = await prisma.pricingBook.findUnique({
      where: { id: pricingBookId },
      select: {
        id: true,
        name: true,
        status: true,
        catalogJson: true,
        settingsJson: true,
        publishedAt: true,
        updatedAt: true,
      },
    });
    return book
      ? toCatalog(book as PricingBookRow)
      : getPublishedPricingCatalog();
  } catch (error) {
    if (isMissingPricingTableError(error)) return getStaticPricingCatalog();
    throw error;
  }
}

export async function getDraftPricingCatalog(
  actorId?: string,
): Promise<ResolvedPricingCatalog> {
  const draft = await ensureDraftPricingBook(actorId);
  return toCatalog(draft);
}

export const getDraftPricingBook = getDraftPricingCatalog;

export async function ensureDraftPricingBook(
  actorId?: string,
): Promise<PricingBookRow> {
  const existing = await prisma.pricingBook.findFirst({
    where: { status: "draft" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      catalogJson: true,
      settingsJson: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
  if (existing) return existing as PricingBookRow;

  const published = await prisma.pricingBook.findFirst({
    where: { status: "published" },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      catalogJson: true,
      settingsJson: true,
      name: true,
    },
  });
  const payload = published
    ? {
        catalogJson: published.catalogJson as Prisma.InputJsonValue,
        settingsJson: published.settingsJson as Prisma.InputJsonValue,
      }
    : staticPayload();

  return prisma.$transaction(async (tx) => {
    const book = await tx.pricingBook.create({
      data: {
        name: published ? `Draft - ${published.name}` : "Draft cenovnik",
        status: "draft",
        createdById: actorId,
        catalogJson: payload.catalogJson,
        settingsJson: payload.settingsJson,
      },
      select: {
        id: true,
        name: true,
        status: true,
        catalogJson: true,
        settingsJson: true,
        publishedAt: true,
        updatedAt: true,
      },
    });
    await syncPricingBookRows(
      tx,
      book.id,
      decodePricingCatalog(book.catalogJson),
      normalizePricingSettings(book.settingsJson),
    );
    await tx.pricingChangeLog.create({
      data: {
        bookId: book.id,
        actorId,
        action: "draft_created",
        detailsJson: { source: published ? "published" : "static" },
      },
    });
    return book as PricingBookRow;
  });
}

export async function clonePublishedPricingToDraft(
  actorId?: string,
): Promise<ResolvedPricingCatalog> {
  const published = await getPublishedPricingCatalog();
  return prisma.$transaction(async (tx) => {
    await tx.pricingBook.updateMany({
      where: { status: "draft" },
      data: { status: "archived" },
    });
    const book = await tx.pricingBook.create({
      data: {
        name: `Draft - ${published.name}`,
        status: "draft",
        createdById: actorId,
        catalogJson: encodePricingCatalog(
          published.categories,
        ) as Prisma.InputJsonValue,
        settingsJson: published.settings as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
        status: true,
        catalogJson: true,
        settingsJson: true,
        publishedAt: true,
        updatedAt: true,
      },
    });
    await syncPricingBookRows(tx, book.id, published.categories, published.settings);
    await tx.pricingChangeLog.create({
      data: {
        bookId: book.id,
        actorId,
        action: "draft_cloned_from_published",
      },
    });
    return toCatalog(book as PricingBookRow);
  });
}

export async function publishDraftPricingBook(
  actorId: string,
): Promise<ResolvedPricingCatalog> {
  const draft = await ensureDraftPricingBook(actorId);
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    await tx.pricingBook.updateMany({
      where: { status: "published" },
      data: { status: "archived" },
    });
    const published = await tx.pricingBook.update({
      where: { id: draft.id },
      data: {
        name: draft.name.replace(/^Draft -\s*/i, ""),
        status: "published",
        publishedAt: now,
        publishedById: actorId,
      },
      select: {
        id: true,
        name: true,
        status: true,
        catalogJson: true,
        settingsJson: true,
        publishedAt: true,
        updatedAt: true,
      },
    });
    await tx.pricingChangeLog.create({
      data: {
        bookId: published.id,
        actorId,
        action: "published",
        detailsJson: { publishedAt: now.toISOString() },
      },
    });
    return toCatalog(published as PricingBookRow);
  });
}

export async function updatePricingDraft(
  actorId: string,
  mutator: (
    categories: ConfiguratorCategory[],
    settings: PricingSettings,
  ) => { categories: ConfiguratorCategory[]; settings: PricingSettings },
  details: Prisma.InputJsonValue,
): Promise<ResolvedPricingCatalog> {
  const draft = await ensureDraftPricingBook(actorId);
  const currentCategories = decodePricingCatalog(draft.catalogJson);
  const currentSettings = normalizePricingSettings(draft.settingsJson);
  const next = mutator(currentCategories, currentSettings);
  const nextSettings = normalizePricingSettings(next.settings);

  return prisma.$transaction(async (tx) => {
    const book = await tx.pricingBook.update({
      where: { id: draft.id },
      data: {
        catalogJson: encodePricingCatalog(
          next.categories,
        ) as Prisma.InputJsonValue,
        settingsJson: nextSettings as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
        status: true,
        catalogJson: true,
        settingsJson: true,
        publishedAt: true,
        updatedAt: true,
      },
    });
    await syncPricingBookRows(tx, draft.id, next.categories, nextSettings);
    await tx.pricingChangeLog.create({
      data: {
        bookId: draft.id,
        actorId,
        action: "draft_updated",
        detailsJson: details,
      },
    });
    return toCatalog(book as PricingBookRow);
  });
}

export async function syncPricingBookRows(
  tx: Prisma.TransactionClient,
  bookId: string,
  categories: ConfiguratorCategory[],
  settings: PricingSettings = DEFAULT_PRICING_SETTINGS,
) {
  await tx.pricingProduct.deleteMany({ where: { bookId } });
  await tx.pricingAddOn.deleteMany({ where: { bookId } });
  await tx.pricingDiscountRule.deleteMany({ where: { bookId } });
  await tx.pricingDurationRule.deleteMany({ where: { bookId } });
  await tx.pricingSetting.deleteMany({ where: { bookId } });

  const products: Prisma.PricingProductCreateManyInput[] = [];
  const addOns: Prisma.PricingAddOnCreateManyInput[] = [];
  const discounts: Prisma.PricingDiscountRuleCreateManyInput[] = [];
  const durations: Prisma.PricingDurationRuleCreateManyInput[] = [];

  categories.forEach((category, categoryIndex) => {
    category.products.forEach((product, productIndex) => {
      const sortOrder = categoryIndex * 1000 + productIndex;
      products.push({
        bookId,
        productId: product.id,
        categoryId: category.id,
        label: product.label,
        unitLabel: product.unitLabel,
        basePriceRsd: product.basePriceRsd,
        includesJson: product.includes as Prisma.InputJsonValue,
        inquiryOnly: product.inquiryOnly ?? false,
        sortOrder,
      });
      product.addOns.forEach((addOn, addOnIndex) => {
        addOns.push({
          bookId,
          productId: product.id,
          addOnId: addOn.id,
          label: addOn.label,
          description: addOn.description,
          priceRsd: addOn.priceRsd,
          priceType: addOn.priceType,
          includedQty: addOn.includedQty,
          maxQty: Number.isFinite(addOn.maxQty) ? addOn.maxQty : null,
          volumeRulesJson: addOn.volumeRules as Prisma.InputJsonValue,
          sortOrder: sortOrder * 100 + addOnIndex,
        });
      });
      product.consumes?.forEach((rule, ruleIndex) => {
        discounts.push({
          bookId,
          ruleId: `${product.id}:${ruleIndex}:${rule.requires}`,
          productId: product.id,
          requires: rule.requires,
          discountPct: rule.discountPct,
          reason: rule.reason,
          conditionJson:
            rule.condition
              ? (rule.condition as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          sourceProductsJson:
            rule.sourceProducts
              ? (rule.sourceProducts as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          sortOrder: sortOrder * 100 + ruleIndex,
        });
      });
      if (product.durationConfig) {
        durations.push(durationRow(bookId, product, null));
        Object.entries(product.sourceModeRules ?? {}).forEach(
          ([sourceMode, override]) => {
            if (!override.perSecondRsd) return;
            durations.push(durationRow(bookId, product, sourceMode));
          },
        );
      }
    });
  });

  if (products.length) await tx.pricingProduct.createMany({ data: products });
  if (addOns.length) await tx.pricingAddOn.createMany({ data: addOns });
  if (discounts.length) await tx.pricingDiscountRule.createMany({ data: discounts });
  if (durations.length) await tx.pricingDurationRule.createMany({ data: durations });
  await tx.pricingSetting.createMany({
    data: [
      {
        bookId,
        key: "global",
        valueJson: {
          rsdRate: settings.rsdRate,
          serbiaVatRate: settings.serbiaVatRate,
          aiCreditUnitsPerCredit: settings.aiCreditUnitsPerCredit,
          aiCreditExpiresAfterMonths: settings.aiCreditExpiresAfterMonths,
        },
      },
      {
        bookId,
        key: "aiCreditTiers",
        valueJson: settings.aiCreditTiers as unknown as Prisma.InputJsonValue,
      },
      {
        bookId,
        key: "specialPricing",
        valueJson: settings.specialPricing as unknown as Prisma.InputJsonValue,
      },
    ],
  });
}

function durationRow(
  bookId: string,
  product: ConfiguratorProduct,
  sourceMode: string | null,
): Prisma.PricingDurationRuleCreateManyInput {
  const config = product.durationConfig!;
  const override = sourceMode ? product.sourceModeRules?.[sourceMode] : null;
  return {
    bookId,
    productId: product.id,
    sourceMode,
    minSeconds: config.minSeconds,
    defaultSeconds: config.defaultSeconds,
    maxSeconds: Number.isFinite(config.maxSeconds) ? config.maxSeconds : null,
    perSecondRsd: override?.perSecondRsd ?? config.perSecondRsd,
    discountTiersJson: config.discountTiers.map((tier) => ({
      ...tier,
      maxSec: Number.isFinite(tier.maxSec) ? tier.maxSec : null,
    })) as Prisma.InputJsonValue,
  };
}

function isMissingPricingTableError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}
