/**
 * /api/nestpay/return — Banca Intesa Nestpay return handler.
 *
 * The bank POSTs the 3DS / authorization result here. Same endpoint
 * serves both okUrl and failUrl by design — the response's `Response`
 * field, validated against the merchant storeKey hash, is the sole
 * authority on outcome.
 *
 * On approval: persist the forensic snapshot, transition the order to
 * paid, fire finishSuccessfulPayment (invoice + email), 303 → /checkout/success.
 * On failure / unverified: persist the snapshot, mark paymentStatus
 * failed, enqueue the bank-mandated failure email, 303 → /checkout/failure.
 *
 * Hash mismatch is treated as a potential tamper attempt: HTTP 400,
 * Sentry alert, no DB writes, generic redirect with no oid leaked.
 */
import { createHash } from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getNestpayConfig,
  isApprovedResponse,
  parseNestpayReturn,
  parseNestpayTrxDate,
  verifyResponseHash,
} from "@/lib/nestpay";
import { getNestpayPublicBaseUrl } from "@/lib/nestpay/url";
import { prisma } from "@/lib/db";
import { transitionOrder } from "@/lib/order/status-machine";
import {
  finishFailedPayment,
  finishSuccessfulPayment,
} from "@/server/actions/payment";
import {
  finishFailedChargePayment,
  finishSuccessfulChargePayment,
} from "@/server/actions/charge-payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirect303(target: string): NextResponse {
  // 303 forces the browser to GET the next URL after a POST. 302 also
  // works in modern browsers but 303 is the spec-correct response.
  return NextResponse.redirect(target, { status: 303 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const baseUrl = getNestpayPublicBaseUrl();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "nestpay-return", stage: "parse" },
    });
    return new NextResponse("Invalid form data", { status: 400 });
  }

  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") fields[key] = value;
  }

  const config = getNestpayConfig();
  const verification = verifyResponseHash(fields, config.storeKey);
  if (!verification.ok) {
    Sentry.captureMessage("[nestpay] response hash mismatch", {
      level: "error",
      tags: {
        area: "payment",
        flow: "nestpay-return",
        stage: "verify-hash",
        reason: verification.reason ?? "unknown",
      },
      extra: { keys: Object.keys(fields), oid: fields.oid ?? null },
    });

    // Diagnostic mode — enabled by setting NESTPAY_HASH_DEBUG=1 in env.
    // Returns the full picture (received vs computed hash, the
    // failure reason, all bank-posted fields) so you can see exactly
    // why verification failed. NEVER leave this enabled in
    // production:
    //   - StoreKey leaks indirectly via the computed-hash value
    //   - Bank-posted fields may include cardholder fragments
    // Reject for the live mode regardless of the flag.
    if (
      process.env.NESTPAY_HASH_DEBUG === "1" &&
      process.env.NEXT_PUBLIC_NESTPAY_MODE !== "live"
    ) {
      // SHA-256 of the storeKey so the user can prove env value === MC value
      // locally without leaking the key. They run:
      //   echo -n "their-store-key" | sha256sum
      // and compare the first 16 hex chars to storeKeySha256.
      const storeKeySha256 = createHash("sha256")
        .update(config.storeKey, "utf8")
        .digest("hex")
        .slice(0, 16);
      return NextResponse.json(
        {
          error: "Hash verification failed (debug mode)",
          reason: verification.reason,
          received: verification.receivedHash ?? null,
          attempts: verification.attempts ?? null,
          storeKeyLength: config.storeKey.length,
          storeKeyFingerprint: `${config.storeKey.slice(0, 2)}…${config.storeKey.slice(-2)}`,
          storeKeySha256,
          clientId: config.clientId,
          fields,
        },
        { status: 400 },
      );
    }

    // Don't leak which field tripped the check; bank-side replay or
    // unrelated POSTs both look the same to a hostile observer.
    return new NextResponse("Hash verification failed", { status: 400 });
  }

  const payload = parseNestpayReturn(fields);
  if (!payload.oid) {
    return new NextResponse("Missing oid", { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { paymentId: payload.oid, paymentProvider: "nestpay" },
    select: { id: true, status: true, paymentStatus: true },
  });
  if (!order) {
    const charge = await prisma.orderCharge.findFirst({
      where: { paymentId: payload.oid, paymentProvider: "nestpay" },
      select: { id: true, orderId: true, paymentStatus: true },
    });

    if (!charge) {
      Sentry.captureMessage("[nestpay] payment target not found for verified oid", {
        level: "warning",
        tags: { area: "payment", flow: "nestpay-return", stage: "lookup" },
        extra: { oid: payload.oid },
      });
      return redirect303(`${baseUrl}/checkout/failure?oid=${encodeURIComponent(payload.oid)}`);
    }

    await prisma.orderCharge.update({
      where: { id: charge.id },
      data: {
        nestpayTransId: payload.transId || null,
        nestpayAuthCode: payload.authCode || null,
        nestpayProcReturnCode: payload.procReturnCode || null,
        nestpayMdStatus: payload.mdStatus || null,
        nestpayHostRefNum: payload.hostRefNum || null,
        nestpayExtraTrxDate: parseNestpayTrxDate(payload.extraTrxDate) ?? null,
        nestpayResponseRaw: fields,
        nestpayResponseHash: fields.hash ?? fields.HASH ?? null,
        nestpayLastQueryAt: new Date(),
      },
    });

    if (isApprovedResponse(payload)) {
      try {
        await finishSuccessfulChargePayment(charge.id, "nestpay");
      } catch (err) {
        Sentry.captureException(err, {
          tags: { area: "payment", flow: "nestpay-return", stage: "finish-charge-success" },
          extra: { chargeId: charge.id, oid: payload.oid },
        });
      }
      return redirect303(
        `${baseUrl}/portal/orders/${charge.orderId}?chargePayment=success`,
      );
    }

    try {
      await finishFailedChargePayment(charge.id);
    } catch (err) {
      Sentry.captureException(err, {
        tags: { area: "payment", flow: "nestpay-return", stage: "finish-charge-failure" },
        extra: { chargeId: charge.id, oid: payload.oid },
      });
    }
    return redirect303(
      `${baseUrl}/portal/orders/${charge.orderId}?chargePayment=failed`,
    );
  }

  // Persist the forensic snapshot regardless of outcome — the inspection
  // checklist expects every Nestpay transaction (success or failure) to
  // be reflected on the order. Idempotent: bank may POST the return
  // twice if the first response timed out.
  await prisma.order.update({
    where: { id: order.id },
    data: {
      nestpayTransId: payload.transId || null,
      nestpayAuthCode: payload.authCode || null,
      nestpayProcReturnCode: payload.procReturnCode || null,
      nestpayMdStatus: payload.mdStatus || null,
      nestpayHostRefNum: payload.hostRefNum || null,
      nestpayExtraTrxDate: parseNestpayTrxDate(payload.extraTrxDate) ?? null,
      nestpayResponseRaw: fields,
      nestpayResponseHash: fields.hash ?? fields.HASH ?? null,
      nestpayLastQueryAt: new Date(),
    },
  });

  const approved = isApprovedResponse(payload);

  if (approved) {
    // Race-safe atomic capture: only one concurrent return can flip
    // paymentStatus to completed and run the post-payment hook.
    const captured = await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: { not: "completed" } },
      data: { paymentStatus: "completed" },
    });

    if (captured.count > 0) {
      try {
        if (order.status !== "paid") {
          await transitionOrder(
            order.id,
            "paid",
            undefined,
            "Nestpay plaćanje potvrđeno",
          );
        }
        await finishSuccessfulPayment(order.id);
      } catch (err) {
        Sentry.captureException(err, {
          tags: { area: "payment", flow: "nestpay-return", stage: "finish-success" },
          extra: { orderId: order.id, oid: payload.oid },
        });
      }
    }

    return redirect303(`${baseUrl}/checkout/success?oid=${encodeURIComponent(payload.oid)}`);
  }

  // Decline / error path.
  try {
    await finishFailedPayment(order.id, {
      provider: "nestpay",
      response: payload.response || undefined,
      procReturnCode: payload.procReturnCode || undefined,
      errMsg: payload.errMsg || undefined,
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "payment", flow: "nestpay-return", stage: "finish-failure" },
      extra: { orderId: order.id, oid: payload.oid },
    });
  }

  return redirect303(`${baseUrl}/checkout/failure?oid=${encodeURIComponent(payload.oid)}`);
}
