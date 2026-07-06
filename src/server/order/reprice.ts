/**
 * reprice.ts — server-side reprice celе porudžbine.
 *
 * Namerno OBIČAN server modul, ne "use server": repriceOrder prima goli
 * orderId bez auth/ownership provere (pozivaoci je već rade), pa ne sme
 * biti registrovan kao javno pozivljiv server-action endpoint. Pozivaju
 * ga isključivo akcije iz item-config.ts i order.ts posle sopstvenih
 * provera vlasništva i statusa.
 */
import { prisma } from "@/lib/db";
import {
  calculateQuote,
  resolveDiscount,
  type QuoteItem,
  type AddOnBreakdown,
} from "@/lib/catalog/calculate";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import {
  calcInteriorTotal,
  type InteriorFloor,
} from "@/lib/catalog/interior-config";
import {
  calcTour360Total,
  defaultTourAssembly,
  type Tour360Config,
  type Tour360Floor,
  type TourAssembly,
} from "@/lib/catalog/tour360-config";
import {
  defaultExt360Config,
  ext360AddOnQuantitiesFor,
  type Ext360Config,
} from "@/lib/catalog/exterior-config";
import { calcTourAssemblyCost } from "@/lib/catalog/tour-assembly";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";
import {
  billingCentsFromEurCents,
  buildChargeSnapshotForCurrency,
} from "@/lib/billing";
import { isChargeCurrency } from "@/lib/currency/config";

function hasTour360Config(cj: unknown): boolean {
  return (
    !!cj &&
    typeof cj === "object" &&
    !Array.isArray(cj) &&
    "floors" in (cj as Record<string, unknown>) &&
    Array.isArray((cj as Record<string, unknown>).floors)
  );
}

function readTour360Config(cj: unknown): Tour360Config {
  if (!hasTour360Config(cj)) {
    return { floors: [], tourAssembly: defaultTourAssembly() };
  }
  const obj = cj as Record<string, unknown>;
  const floors = (obj.floors as Tour360Floor[]) ?? [];
  const ta =
    obj.tourAssembly &&
    typeof obj.tourAssembly === "object" &&
    !Array.isArray(obj.tourAssembly)
      ? { ...defaultTourAssembly(), ...(obj.tourAssembly as TourAssembly) }
      : defaultTourAssembly();
  return { floors, tourAssembly: ta };
}

// Re-price every item in an order. Applies the cross-service "model-first"
// discount resolver across all siblings so adding/removing one item can update
// sibling discounts. int-static items keep their calcInteriorTotal-based base
// total and apply the resolved discount as a flat scalar on top.
export async function repriceOrder(orderId: string) {
  const pricingCatalog = await getPublishedPricingCatalog();
  const specialPricing = pricingCatalog.settings.specialPricing;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      referencedOrderId: true,
      billingCurrency: true,
      billingVatRate: true,
      chargedCurrency: true,
      paymentStatus: true,
    },
  });
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    orderBy: { id: "asc" },
  });

  // Reconstruct QuoteItem[] from persisted items so the resolver sees every
  // sibling's productId and add-on quantities.
  const toQuoteItem = (i: (typeof items)[number]): QuoteItem => {
    const addOns = (Array.isArray(i.addOnsJson)
      ? (i.addOnsJson as unknown as AddOnBreakdown[])
      : []) as AddOnBreakdown[];
    const addOnQuantities: Record<string, number> = {};
    for (const ao of addOns) addOnQuantities[ao.addOnId] = ao.quantity;
    return {
      instanceId: i.id,
      productId: i.productId,
      categoryId: i.categoryId,
      addOnQuantities,
      ...(i.aiCreditQuantity != null
        ? { aiCreditQuantity: i.aiCreditQuantity }
        : {}),
      ...(i.durationSeconds != null ? { durationSeconds: i.durationSeconds } : {}),
    };
  };
  const quoteItems: QuoteItem[] = items.map(toQuoteItem);

  // Rule 3 + 4: pull assets from a referenced prior order so they feed
  // the discount resolver without showing up in the current order's
  // totals. If the referenced order is still active (paid through
  // revision_requested), flag the items so the resolver can apply the
  // +5pp active-project boost.
  let externalSources: QuoteItem[] = [];
  if (order?.referencedOrderId) {
    const ref = await prisma.order.findUnique({
      where: { id: order.referencedOrderId },
      select: { status: true },
    });
    const refItems = await prisma.orderItem.findMany({
      where: { orderId: order.referencedOrderId },
      orderBy: { id: "asc" },
    });
    const ACTIVE_STATUSES = new Set([
      "paid",
      "in_progress",
      "in_review",
      "revision_requested",
    ]);
    const isActive = ref ? ACTIVE_STATUSES.has(ref.status) : false;
    externalSources = refItems.map((i) => ({
      ...toQuoteItem(i),
      fromActiveExternalOrder: isActive,
    }));
  }

  // int-static and configured int-360 items are priced separately below
  // (per-floor calculations) but still need to appear in the resolver's
  // asset inventory so the engine can discount siblings that consume
  // interior-model / tour-content. Route them through externalSources:
  // contributes to inventory, no breakdown in the engine output.
  // int-360 items WITHOUT a per-floor configJson fall back to standard
  // engine pricing (legacy path for drafts created before this UI).
  const tour360IdsWithFloors = new Set(
    items
      .filter(
        (i) => i.productId === "int-360" && hasTour360Config(i.configJson),
      )
      .map((i) => i.id),
  );
  // ext-360 items with a config get the same special-case treatment as
  // int-360 because their per-item Tour Assembly cost (2.344 RSD/1.758 RSD/4.102 RSD) is
  // not modeled as a catalog add-on — we add it on top in the loop.
  const ext360IdsWithConfig = new Set(
    items
      .filter(
        (i) =>
          i.productId === "ext-360" &&
          !!i.configJson &&
          typeof i.configJson === "object" &&
          "hotspotCount" in (i.configJson as Record<string, unknown>),
      )
      .map((i) => i.id),
  );
  const standardItems = quoteItems.filter(
    (qi) =>
      qi.productId !== "int-static" &&
      !tour360IdsWithFloors.has(qi.instanceId) &&
      !ext360IdsWithConfig.has(qi.instanceId),
  );
  const intStaticAsSources = quoteItems.filter(
    (qi) => qi.productId === "int-static",
  );
  const tour360AsSources = quoteItems.filter((qi) =>
    tour360IdsWithFloors.has(qi.instanceId),
  );
  const ext360AsSources = quoteItems.filter((qi) =>
    ext360IdsWithConfig.has(qi.instanceId),
  );
  const calc = calculateQuote(
    standardItems,
    [
      ...externalSources,
      ...intStaticAsSources,
      ...tour360AsSources,
      ...ext360AsSources,
    ],
    pricingCatalog,
  );
  const breakdownById = new Map(calc.items.map((b) => [b.instanceId, b]));

  let orderTotalCents = 0;
  let premiumTotalCents = 0;
  let containsAiCredits = false;

  for (const i of items) {
    const existingTotalCents = i.totalCents ?? i.totalEur * 100;

    // Inquiry-only items (e.g. converted VR projects) carry a manually
    // set price agreed during consultation — never recompute from the
    // catalog, just keep the existing totalEur.
    const lookup = getConfiguratorProduct(i.productId, pricingCatalog.categories);
    if (i.kind === "ai_credits") {
      const bd = breakdownById.get(i.id);
      if (bd) {
        await prisma.orderItem.update({
          where: { id: i.id },
          data: {
            basePriceEur: Math.round(bd.basePriceEur),
            basePriceCents: bd.basePriceCents,
            totalEur: Math.round(bd.totalEur),
            totalCents: bd.totalCents,
            aiCreditQuantity: bd.aiCreditQuantity ?? i.aiCreditQuantity,
            aiCreditUnits: bd.aiCreditUnits ?? i.aiCreditUnits,
            addOnsJson: [],
            originalTotalEur: Math.round(bd.originalTotalEur),
            discountPct: 0,
            discountReason: null,
          },
        });
        orderTotalCents += bd.totalCents;
      } else {
        orderTotalCents += existingTotalCents;
      }
      containsAiCredits = true;
      continue;
    }

    if (lookup?.product.inquiryOnly) {
      orderTotalCents += existingTotalCents;
      premiumTotalCents += existingTotalCents;
      continue;
    }

    if (i.productId === "int-static") {
      // int-static pricing derives from configJson.floors; apply discount on top.
      const floors = (i.configJson && typeof i.configJson === "object" &&
        "floors" in (i.configJson as Record<string, unknown>)
        ? (i.configJson as { floors: InteriorFloor[] }).floors
        : []) as InteriorFloor[];
      const preDiscount = calcInteriorTotal(
        floors,
        specialPricing.interior,
      ).totalEur;
      const target = quoteItems.find((q) => q.instanceId === i.id);
      const discount = target
        ? resolveDiscount(
            target,
            [...quoteItems, ...externalSources],
            pricingCatalog,
          )
        : null;
      const totalEur = discount
        ? Math.round(preDiscount * (1 - discount.pct / 100))
        : preDiscount;
      await prisma.orderItem.update({
        where: { id: i.id },
        data: {
          totalEur,
          basePriceCents: preDiscount * 100,
          totalCents: totalEur * 100,
          originalTotalEur: preDiscount,
          discountPct: discount?.pct ?? 0,
          discountReason: discount?.reason ?? null,
        },
      });
      orderTotalCents += totalEur * 100;
      premiumTotalCents += totalEur * 100;
      continue;
    }

    if (tour360IdsWithFloors.has(i.id)) {
      // int-360 pricing: per-floor (rooms / hotspots / static cameras)
      // + tour-assembly cost; resolver discount applied on top.
      const cfg = readTour360Config(i.configJson);
      const preDiscount = calcTour360Total(
        cfg.floors,
        cfg.tourAssembly,
        specialPricing.tour360,
      ).totalEur;
      const target = quoteItems.find((q) => q.instanceId === i.id);
      const discount = target
        ? resolveDiscount(
            target,
            [...quoteItems, ...externalSources],
            pricingCatalog,
          )
        : null;
      const totalEur = discount
        ? Math.round(preDiscount * (1 - discount.pct / 100))
        : preDiscount;
      await prisma.orderItem.update({
        where: { id: i.id },
        data: {
          totalEur,
          basePriceCents: preDiscount * 100,
          totalCents: totalEur * 100,
          originalTotalEur: preDiscount,
          discountPct: discount?.pct ?? 0,
          discountReason: discount?.reason ?? null,
        },
      });
      orderTotalCents += totalEur * 100;
      premiumTotalCents += totalEur * 100;
      continue;
    }

    if (ext360IdsWithConfig.has(i.id)) {
      // ext-360 pricing: catalog rendering (basePrice + per-hotspot
      // add-on, computed via single-item calculateQuote) + tour
      // assembly cost on top; resolver discount applied to combined.
      const cfg =
        i.configJson && typeof i.configJson === "object"
          ? (i.configJson as unknown as Ext360Config)
          : defaultExt360Config();
      const renderingQI: QuoteItem = {
        instanceId: i.id,
        productId: "ext-360",
        categoryId: "exterior",
        addOnQuantities: ext360AddOnQuantitiesFor(cfg),
      };
      const renderingBreakdown = calculateQuote(
        [renderingQI],
        [],
        pricingCatalog,
      ).items[0];
      const renderingCost = renderingBreakdown?.totalEur ?? i.totalEur;
      const assemblyCost = calcTourAssemblyCost(
        cfg.tourAssembly ?? {
          webTourEnabled: false,
          floorPlanNavEnabled: false,
          whiteLabelEnabled: false,
        },
        cfg.hotspotCount ?? 1,
        specialPricing.tourAssembly,
      ).totalCost;
      const preDiscount = renderingCost + assemblyCost;
      const target = quoteItems.find((q) => q.instanceId === i.id);
      const discount = target
        ? resolveDiscount(
            target,
            [...quoteItems, ...externalSources],
            pricingCatalog,
          )
        : null;
      const totalEur = discount
        ? Math.round(preDiscount * (1 - discount.pct / 100))
        : preDiscount;
      await prisma.orderItem.update({
        where: { id: i.id },
        data: {
          totalEur,
          basePriceCents: preDiscount * 100,
          totalCents: totalEur * 100,
          originalTotalEur: preDiscount,
          addOnsJson: renderingBreakdown?.addOns ?? [],
          discountPct: discount?.pct ?? 0,
          discountReason: discount?.reason ?? null,
        },
      });
      orderTotalCents += totalEur * 100;
      premiumTotalCents += totalEur * 100;
      continue;
    }

    const bd = breakdownById.get(i.id);
    if (!bd) {
      // Unknown product id (shouldn't happen) — leave the row as-is.
      orderTotalCents += existingTotalCents;
      premiumTotalCents += existingTotalCents;
      continue;
    }
    await prisma.orderItem.update({
      where: { id: i.id },
      data: {
        basePriceEur: bd.basePriceEur,
        basePriceCents: bd.basePriceCents,
        totalEur: bd.totalEur,
        totalCents: bd.totalCents,
        addOnsJson: bd.addOns,
        durationSeconds: bd.durationSeconds ?? null,
        durationDiscount: bd.durationDiscount ?? null,
        originalTotalEur: bd.originalTotalEur,
        discountPct: bd.discountPct,
        discountReason: bd.discountReason,
      },
    });
    orderTotalCents += bd.totalCents;
    premiumTotalCents += bd.totalCents;
  }

  const billingTotalCents = order?.billingCurrency
    ? billingCentsFromEurCents(orderTotalCents, {
        billingCurrency: order.billingCurrency,
        billingVatRate:
          order.billingVatRate ?? pricingCatalog.settings.serbiaVatRate,
      })
    : undefined;

  // Refresh the charged-amount snapshot for unpaid orders so the PayPal
  // charge always matches the current total. The currency itself stays
  // locked (it was chosen from geo at creation); paid orders keep the
  // amount they were actually charged.
  const chargeSnapshot =
    order &&
    order.paymentStatus !== "completed" &&
    isChargeCurrency(order.chargedCurrency)
      ? buildChargeSnapshotForCurrency(orderTotalCents, order.chargedCurrency)
      : null;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      totalEur: Math.round(orderTotalCents / 100),
      totalCents: orderTotalCents,
      premiumTotalEur: Math.round(premiumTotalCents / 100),
      ...(billingTotalCents !== undefined ? { billingTotalCents } : {}),
      ...(chargeSnapshot
        ? {
            chargedAmountMinor: chargeSnapshot.chargedAmountMinor,
            chargedFxRate: chargeSnapshot.chargedFxRate,
            chargedFxAsOf: chargeSnapshot.chargedFxAsOf,
          }
        : {}),
      containsAiCredits,
    },
  });
}
