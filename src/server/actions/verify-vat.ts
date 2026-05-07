/**
 * verify-vat.ts — Admin action that runs a VIES lookup against an
 * order's company VAT ID and stores the result on the Order.
 *
 * Why admin-only (not customer self-service): VIES is rate-limited
 * and flaky during member-state outages. Letting customers retry on
 * blur during checkout would burn quota and produce confusing UX
 * during downtime. Admin-side verification is a deliberate review
 * step before issuing an export invoice with 0% VAT (čl. 24 ZPDV).
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { requireAdmin } from "@/server/actions/admin";
import {
  verifyVatViaVies,
  isViesCountry,
  type ViesResult,
} from "@/lib/vies";

export type VerifyVatResult =
  | { ok: true; result: ViesResult }
  | { ok: false; reason: string };

export async function verifyOrderVat(
  orderId: string,
): Promise<VerifyVatResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, reason: "not_admin" };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        buyerType: true,
        companyTaxId: true,
        companyCountryCode: true,
      },
    });
    if (!order) return { ok: false, reason: "order_not_found" };

    if (order.buyerType !== "company_foreign") {
      return { ok: false, reason: "not_foreign_company" };
    }
    if (!order.companyTaxId || !order.companyCountryCode) {
      return { ok: false, reason: "missing_vat_data" };
    }
    if (!isViesCountry(order.companyCountryCode)) {
      return { ok: false, reason: "non_eu_country" };
    }

    const result = await verifyVatViaVies(
      order.companyCountryCode,
      order.companyTaxId,
    );

    if (result.status === "valid") {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          vatVerifiedAt: result.checkedAt,
          vatVerifiedName: result.name,
          vatRequestId: result.requestId,
        },
      });
    } else if (result.status === "invalid") {
      // Clear any stale verification — if a VAT ID was valid earlier
      // and is no longer, we should not keep the badge from a previous
      // successful check.
      await prisma.order.update({
        where: { id: orderId },
        data: {
          vatVerifiedAt: null,
          vatVerifiedName: null,
          vatRequestId: result.requestId,
        },
      });
    }
    // For `error` and `unsupported_country` we leave the existing
    // verification snapshot alone — a transient VIES outage shouldn't
    // wipe a previously-verified VAT.

    await recordAuditLog({
      action: "vat.verification_attempted",
      entityType: "Order",
      entityId: orderId,
      metadata: {
        actorId: admin.id,
        countryCode: result.countryCode,
        vatNumber: result.vatNumber,
        status: result.status,
        ...(result.status === "error" && { reason: result.reason }),
        ...(result.status === "valid" && { name: result.name }),
      },
    });

    revalidatePath(`/portal/admin/porudzbine/${orderId}`);

    return { ok: true, result };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "vies", flow: "verify-order-vat" },
      extra: { orderId },
    });
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "unknown",
    };
  }
}
