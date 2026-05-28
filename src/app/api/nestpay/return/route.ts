/**
 * /api/nestpay/return — Banca Intesa Nestpay return handler.
 *
 * The bank POSTs the 3DS / authorization result here. Same endpoint
 * serves both okUrl and failUrl by design — the response's `Response`
 * field, validated against the merchant storeKey hash, is the sole
 * authority on outcome.
 *
 * On approval: persist the forensic snapshot, transition the order to
 * paid, fire finishSuccessfulPayment (invoice + email), 303 → /poruci/uspeh.
 * On failure / unverified: persist the snapshot, mark paymentStatus
 * failed, enqueue the bank-mandated failure email, 303 → /poruci/neuspeh.
 *
 * Hash mismatch is treated as a potential tamper attempt: HTTP 400,
 * Sentry alert, no DB writes, generic redirect with no oid leaked.
 */
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
import { prisma } from "@/lib/db";
import { transitionOrder } from "@/lib/order/status-machine";
import {
  finishFailedPayment,
  finishSuccessfulPayment,
} from "@/server/actions/payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBaseUrl(request: NextRequest): string {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.AUTH_URL ?? "http://localhost:3000";
}

function redirect303(target: string): NextResponse {
  // 303 forces the browser to GET the next URL after a POST. 302 also
  // works in modern browsers but 303 is the spec-correct response.
  return NextResponse.redirect(target, { status: 303 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const baseUrl = getBaseUrl(request);

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
  const hashValid = verifyResponseHash(fields, config.storeKey);
  if (!hashValid) {
    Sentry.captureMessage("[nestpay] response hash mismatch", {
      level: "error",
      tags: { area: "payment", flow: "nestpay-return", stage: "verify-hash" },
      extra: { keys: Object.keys(fields), oid: fields.oid ?? null },
    });
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
    Sentry.captureMessage("[nestpay] order not found for verified oid", {
      level: "warning",
      tags: { area: "payment", flow: "nestpay-return", stage: "lookup" },
      extra: { oid: payload.oid },
    });
    return redirect303(`${baseUrl}/poruci/neuspeh?oid=${encodeURIComponent(payload.oid)}`);
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
      nestpayResponseHash: fields.hash ?? null,
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

    return redirect303(`${baseUrl}/poruci/uspeh?oid=${encodeURIComponent(payload.oid)}`);
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

  return redirect303(`${baseUrl}/poruci/neuspeh?oid=${encodeURIComponent(payload.oid)}`);
}
