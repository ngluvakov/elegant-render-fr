/**
 * order.ts — Order creation and file upload confirmation server actions.
 *
 * Exports createOrder() (server-side quote verification + Prisma insert +
 * Bitrix24 deal sync) and confirmFileUpload() for source material uploads.
 *
 * Used by: checkout/steps/step-details, order-file-upload, revision-upload-card
 */
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import * as Sentry from "@sentry/nextjs";
import { priceItems, type QuoteItem } from "@/lib/catalog/calculate";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import { isAiCreditProduct } from "@/lib/ai-studio/catalog";
import { generateOrderNumber } from "@/lib/order/generate-number";
import {
  checkRateLimit,
  getServerActionIdentifier,
  rateLimitMessage,
} from "@/lib/rate-limit";
import { repriceOrder } from "@/server/order/reprice";
import { syncNewDeal } from "@/server/bitrix/sync-deal";
import { enforceCleanScan } from "@/lib/file-scan";
import { syncFileToDeal } from "@/server/bitrix/sync-file";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";
import { recordAuditLog } from "@/lib/audit";
import { getPublicCountryCode } from "@/lib/catalog/public-currency-server";
import {
  validateBuyerInfo,
  type BuyerInfoInput,
} from "@/lib/buyer-validation";
import {
  billingCentsFromEurCents,
  buildBillingSnapshot,
  buildChargeSnapshot,
  type BillingSnapshotInput,
} from "@/lib/billing";
import { recordUserActivity } from "@/lib/user-activity";

export type OrderResult = {
  error?: string;
  orderId?: string;
  orderNumber?: string;
};

async function getStoredBuyerInfo(userId: string): Promise<BuyerInfoInput> {
  const [user, publicCountryCode] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        billingBuyerType: true,
        billingCountryCode: true,
        billingCompanyName: true,
        billingCompanyTaxId: true,
        billingCompanyAddress: true,
      },
    }),
    getPublicCountryCode(),
  ]);

  const buyerType = user?.billingBuyerType ?? "individual";
  const fallbackCountryCode = publicCountryCode ?? "RS";
  const buyerCountryCode =
    user?.billingCountryCode ??
    (buyerType === "individual" ? fallbackCountryCode : null);

  return {
    buyerType,
    buyerCountryCode,
    companyName: user?.billingCompanyName ?? null,
    companyTaxId: user?.billingCompanyTaxId ?? null,
    companyAddress: user?.billingCompanyAddress ?? null,
    companyCountryCode: buyerType === "business" ? buyerCountryCode : null,
  };
}

export async function createOrder(
  userId: string,
  quoteItems: QuoteItem[],
  customerNote?: string,
  withdrawalWaivedAt?: Date | null,
  buyerInfo?: BuyerInfoInput,
): Promise<OrderResult> {
  if (!userId) return { error: "L’utilisateur n’a pas pu être identifié." };
  // Guest checkout passes without a session (userId comes from
  // ensureCheckoutUser), but when a session exists, the client-supplied
  // userId must be exactly that user — otherwise a signed-in user could
  // open drafts under someone else's account.
  const session = await auth();
  if (session?.user?.id && session.user.id !== userId) {
    return { error: "L’utilisateur n’a pas pu être identifié." };
  }
  if (!quoteItems.length) return { error: "Votre devis est vide." };
  if (!withdrawalWaivedAt) {
    // EU CRD Art. 16(m) / Serbian Consumer Protection Act Art. 28: digital
    // services started before the 14-day window expires require an
    // explicit waiver. The checkout review step gates the submit
    // button on this checkbox, so this branch should only fire on a
    // tampered client.
    return {
      error:
        "Avant de confirmer votre commande, vous devez accepter que la production commence immédiatement, ce qui vous fait renoncer à votre droit de rétractation de 14 jours.",
    };
  }

  // Buyer-info validation runs server-side regardless of client checks.
  // Portal shortcuts may omit buyerInfo, so derive it from the saved
  // profile instead of asking logged-in users to repeat those fields.
  const buyer = buyerInfo ?? (await getStoredBuyerInfo(userId));
  const buyerError = validateBuyerInfo(buyer);
  if (buyerError) return { error: buyerError };

  // Rate-limit before any DB writes. createOrder is reachable from
  // /commande by anyone (guest or logged-in), so a tampered client could
  // spam Order rows. Identifier prefers user:<id> when authenticated.
  const identifier = await getServerActionIdentifier();
  const limit = await checkRateLimit("checkout", identifier);
  if (!limit.ok) {
    return { error: rateLimitMessage(limit.retryAfterSeconds) };
  }

  // Defensive: inquiry-only products (VR) must never enter the order /
  // payment flow. They route to /services/vr/consultation from /tarifs; if
  // one slips through (tampered cart, stale URL), refuse the order.
  const pricingCatalog = await getPublishedPricingCatalog();
  for (const qi of quoteItems) {
    if (isAiCreditProduct(qi.productId)) continue;
    const lookup = getConfiguratorProduct(qi.productId, pricingCatalog.categories);
    if (!lookup) return { error: "Article inconnu dans le devis." };
    if (lookup?.product.inquiryOnly) {
      return {
        error:
          "Les services VR ne peuvent pas être payés directement — demandez une consultation.",
      };
    }
  }

  // Server-side price verification. priceItems is the orchestrator that
  // routes int-static / int-360 items through their per-floor helpers
  // (calcInteriorTotal / calcTour360Total) so the order total matches
  // what the customer saw on /tarifs exactly.
  const calculation = priceItems(quoteItems, [], pricingCatalog);

  if (calculation.total <= 0) {
    return { error: "Le prix total doit être supérieur à 0." };
  }

  const billingSnapshot = buildBillingSnapshot(
    buyer,
    pricingCatalog.settings,
  );
  const billingTotalCents = calculation.items.reduce(
    (sum, item) =>
      sum + billingCentsFromEurCents(item.totalCents, billingSnapshot),
    0,
  );

  // Charged-amount snapshot: what PayPal will actually charge, in the
  // visitor's presentment currency. Currency comes from the server-side
  // geo header (never from a client-passed value) so it matches what
  // the public pages displayed for this visitor.
  const chargeSnapshot = buildChargeSnapshot(
    calculation.totalCents,
    await getPublicCountryCode(),
  );

  const orderNumber = generateOrderNumber();
  const containsAiCredits = calculation.items.some(
    (item) => item.kind === "ai_credits",
  );
  const premiumItems = calculation.items.filter(
    (item) => item.kind === "service",
  );
  const premiumTotalEur = premiumItems.reduce(
    (sum, item) => sum + item.totalEur,
    0,
  );

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      totalEur: Math.round(calculation.total),
      totalCents: calculation.totalCents,
      premiumTotalEur: Math.round(premiumTotalEur),
      containsAiCredits,
      customerNote: customerNote || null,
      withdrawalWaivedAt,
      buyerType: billingSnapshot.buyerType,
      buyerCountryCode: billingSnapshot.buyerCountryCode,
      companyName: billingSnapshot.companyName,
      companyTaxId: billingSnapshot.companyTaxId,
      companyAddress: billingSnapshot.companyAddress,
      companyCountryCode: billingSnapshot.companyCountryCode,
      billingCurrency: billingSnapshot.billingCurrency,
      billingVatRate: billingSnapshot.billingVatRate,
      billingTotalCents,
      chargedCurrency: chargeSnapshot.chargedCurrency,
      chargedAmountMinor: chargeSnapshot.chargedAmountMinor,
      chargedFxRate: chargeSnapshot.chargedFxRate,
      chargedFxAsOf: chargeSnapshot.chargedFxAsOf,
      items: {
        create: calculation.items.map((item) => {
          const sourceQI = quoteItems.find(
            (q) => q.instanceId === item.instanceId,
          );
          // Carry the per-floor config straight onto OrderItem.configJson
          // so repriceOrder + the portal editor see the same shape the
          // customer just configured on /tarifs. Without this, /pricing-
          // originated int-static / int-360 orders booted with empty
          // configJson and the portal would seed defaults that didn't
          // match the customer's plan.
          const configJson =
            sourceQI?.interiorConfig
              ? { floors: sourceQI.interiorConfig }
              : sourceQI?.tour360Config
                ? sourceQI.tour360Config
                : undefined;
          return {
            productId: item.productId,
            categoryId: sourceQI?.categoryId ?? "",
            kind: item.kind,
            productLabel: item.productLabel,
            categoryLabel: item.categoryLabel,
            basePriceEur: Math.round(item.basePriceEur),
            basePriceCents: item.basePriceCents,
            totalEur: Math.round(item.totalEur),
            totalCents: item.totalCents,
            aiCreditQuantity: item.aiCreditQuantity ?? null,
            aiCreditUnits: item.aiCreditUnits ?? null,
            addOnsJson: item.addOns,
            durationSeconds: item.durationSeconds ?? null,
            durationDiscount: item.durationDiscount ?? null,
            originalTotalEur: Math.round(item.originalTotalEur),
            discountPct: item.discountPct,
            discountReason: item.discountReason,
            ...(configJson !== undefined ? { configJson } : {}),
          };
        }),
      },
      statusEvents: {
        create: {
          toStatus: "draft",
          note: "Commande créée",
        },
      },
    },
  });

  // Sync premium orders to Bitrix24. Credit-only orders stay inside the
  // platform until we decide how to represent them in CRM/reporting.
  if (premiumItems.length > 0) {
    syncNewDeal(order.id).catch((err) => {
      Sentry.captureException(err, {
        tags: { area: "bitrix", flow: "sync-new-deal" },
        extra: { orderId: order.id, orderNumber: order.orderNumber },
      });
    });
  }

  // Forensic trail of who chose which buyer identity. Helpful when SEF
  // / ESIR pipelines start firing and we need to backtrack from an
  // invoice mismatch to the original checkout choice.
  await recordAuditLog({
    action: "order.created_with_buyer_info",
    entityType: "Order",
    entityId: order.id,
    metadata: {
      buyerType: order.buyerType,
      hasCompanyTaxId: Boolean(order.companyTaxId),
      countryCode: order.buyerCountryCode ?? order.companyCountryCode ?? null,
      billingCurrency: order.billingCurrency,
      billingTotalCents: order.billingTotalCents,
      chargedCurrency: order.chargedCurrency,
      chargedAmountMinor: order.chargedAmountMinor,
    },
  });
  await recordUserActivity(userId, { ordersCreated: 1 });

  return { orderId: order.id, orderNumber: order.orderNumber };
}

export async function createEmptyDraft(): Promise<OrderResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous n’êtes pas connecté." };

  // Snapshot the user's billing identity onto the draft from the moment
  // the draft is created — matching createOrder.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      billingBuyerType: true,
      billingCountryCode: true,
      billingCompanyName: true,
      billingCompanyTaxId: true,
      billingCompanyAddress: true,
    },
  });
  const pricingCatalog = await getPublishedPricingCatalog();
  const snapshotInput: BillingSnapshotInput = {
    buyerType: user?.billingBuyerType ?? "individual",
    buyerCountryCode: user?.billingCountryCode ?? null,
    companyName: user?.billingCompanyName ?? null,
    companyTaxId: user?.billingCompanyTaxId ?? null,
    companyAddress: user?.billingCompanyAddress ?? null,
    companyCountryCode: user?.billingCountryCode ?? null,
  };
  const billingSnapshot = buildBillingSnapshot(
    snapshotInput,
    pricingCatalog.settings,
    user?.billingCountryCode ?? "RS",
  );

  // Empty drafts still lock their presentment currency from geo now;
  // repriceOrder refreshes chargedAmountMinor as items are added.
  const chargeSnapshot = buildChargeSnapshot(0, await getPublicCountryCode());

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: session.user.id,
      totalEur: 0,
      totalCents: 0,
      buyerType: billingSnapshot.buyerType,
      buyerCountryCode: billingSnapshot.buyerCountryCode,
      companyName: billingSnapshot.companyName,
      companyTaxId: billingSnapshot.companyTaxId,
      companyAddress: billingSnapshot.companyAddress,
      companyCountryCode: billingSnapshot.companyCountryCode,
      billingCurrency: billingSnapshot.billingCurrency,
      billingVatRate: billingSnapshot.billingVatRate,
      billingTotalCents: 0,
      chargedCurrency: chargeSnapshot.chargedCurrency,
      chargedAmountMinor: chargeSnapshot.chargedAmountMinor,
      chargedFxRate: chargeSnapshot.chargedFxRate,
      chargedFxAsOf: chargeSnapshot.chargedFxAsOf,
      items: { create: [] },
      statusEvents: {
        create: { toStatus: "draft", note: "Brouillon créé depuis l’espace client" },
      },
    },
  });

  revalidatePath("/portal/orders");
  revalidatePath("/portal");
  await recordUserActivity(session.user.id, { ordersCreated: 1 });

  return { orderId: order.id, orderNumber: order.orderNumber };
}

export async function deleteDraftOrder(
  orderId: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous n’êtes pas connecté." };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, status: true },
  });
  if (!order) return { error: "Commande introuvable." };
  if (order.userId !== session.user.id)
    return { error: "Vous n’y avez pas accès." };
  if (order.status !== "draft" && order.status !== "cancelled")
    return { error: "Seuls les brouillons et les commandes annulées peuvent être supprimés." };

  await prisma.order.delete({ where: { id: orderId } });
  revalidatePath("/portal/orders");
  revalidatePath("/portal");
  return { success: true };
}

/**
 * setOrderReference — link a draft order to a prior paid order so its
 * model assets feed the cross-service discount resolver.
 * Pass referencedOrderId = null to clear the link.
 */
export async function setOrderReference(
  orderId: string,
  referencedOrderId: string | null,
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous n’êtes pas connecté." };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, status: true },
  });
  if (!order) return { error: "Commande introuvable." };
  if (order.userId !== session.user.id) return { error: "Vous n’y avez pas accès." };
  if (order.status !== "draft")
    return { error: "Une référence ne peut être définie que sur un brouillon." };

  if (referencedOrderId) {
    if (referencedOrderId === orderId)
      return { error: "Une commande ne peut pas se référencer elle-même." };
    const ref = await prisma.order.findUnique({
      where: { id: referencedOrderId },
      select: { userId: true, status: true },
    });
    if (!ref) return { error: "La commande référencée n’existe pas." };
    if (ref.userId !== session.user.id)
      return { error: "Vous n’avez pas accès à la commande référencée." };
    if (ref.status === "draft" || ref.status === "awaiting_payment")
      return { error: "La référence doit être une commande payée." };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { referencedOrderId },
  });

  // Discounts for the current order may change — re-run the engine.
  await repriceOrder(orderId);
  revalidatePath(`/portal/orders/${orderId}`);
  return { success: true };
}

export async function updateProjectName(
  orderId: string,
  name: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vous n’êtes pas connecté." };

  const trimmed = name.trim().slice(0, 100);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  });
  if (!order) return { error: "Commande introuvable." };
  if (order.userId !== session.user.id)
    return { error: "Vous n’y avez pas accès." };

  await prisma.order.update({
    where: { id: orderId },
    data: { projectName: trimmed.length > 0 ? trimmed : null },
  });
  revalidatePath(`/portal/orders/${orderId}`);
  return { success: true };
}

export async function confirmFileUpload(
  orderId: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  storagePath: string,
) {
  // ISO 27001 A.8.7. Sync AV scan before any DB row is created — an
  // infected upload never enters our system. enforceCleanScan handles
  // delete-from-storage + audit log on failure.
  const scan = await enforceCleanScan({
    storagePath,
    fileName,
    fileSize,
    mimeType,
    entityType: "Order",
    entityId: orderId,
  });
  if (!scan.ok) {
    return { error: scan.userError };
  }

  const file = await prisma.orderFile.create({
    data: {
      orderId,
      fileName,
      fileSize,
      mimeType,
      storagePath,
      kind: "source",
      scanStatus: "clean",
      scannedAt: new Date(),
    },
  });

  syncFileToDeal(file.id).catch((err) => {
    Sentry.captureException(err, {
      tags: { area: "bitrix", flow: "sync-file" },
      extra: { fileId: file.id, orderId: file.orderId ?? null },
    });
  });

  return { success: true };
}
