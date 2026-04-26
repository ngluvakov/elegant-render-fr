/**
 * vr-inquiry.ts — Server actions for VR consultation requests.
 *
 * VR products (vr-existing, vr-standalone) bypass the cart/payment
 * flow. Customers fill a public intake form on /usluge/vr/konsultacija
 * which posts here; we sanitize, persist as VrInquiry, and notify the
 * team via email so they can schedule a meeting.
 */
"use server";

import crypto from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  sendVrInquiryAdminEmail,
  sendVrInquiryCustomerEmail,
  sendVrProjectReadyEmail,
} from "@/lib/email";
import { sanitizeVrConfig, type VrConfig, type VrProductId } from "@/lib/catalog/vr-config";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";
import { generateOrderNumber } from "@/lib/order/generate-number";

export type VrInquiryInput = {
  productId: string;
  config: unknown;
  contactName: string;
  email: string;
  phone?: string;
  message?: string;
};

export type VrInquiryResult =
  | { ok: true; inquiryId: string }
  | { error: string };

const VALID_PRODUCT_IDS: VrProductId[] = ["vr-existing", "vr-standalone"];

function validEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function submitVrInquiry(
  input: VrInquiryInput,
): Promise<VrInquiryResult> {
  if (!input || typeof input !== "object") {
    return { error: "Neispravan zahtev." };
  }

  const productId = String(input.productId ?? "");
  if (!VALID_PRODUCT_IDS.includes(productId as VrProductId)) {
    return { error: "Nepoznata VR usluga." };
  }
  const product = getConfiguratorProduct(productId);
  if (!product || !product.product.inquiryOnly) {
    return { error: "Nepoznata VR usluga." };
  }

  const contactName = String(input.contactName ?? "").trim().slice(0, 120);
  if (contactName.length < 2) {
    return { error: "Ime je obavezno." };
  }
  const email = String(input.email ?? "").trim().toLowerCase().slice(0, 200);
  if (!validEmail(email)) {
    return { error: "Email adresa nije ispravna." };
  }
  const phone = input.phone ? String(input.phone).trim().slice(0, 40) : undefined;
  const message = input.message ? String(input.message).trim().slice(0, 4000) : undefined;

  // sanitizeVrConfig fills defaults for missing fields, so the inquiry
  // always has a complete shape even when the customer leaves advanced
  // sections blank.
  const sanitizedConfig = sanitizeVrConfig(
    (input.config && typeof input.config === "object"
      ? (input.config as VrConfig)
      : ({} as VrConfig)),
  );

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const inquiry = await prisma.vrInquiry.create({
    data: {
      productId,
      configJson: sanitizedConfig as unknown as object,
      contactName,
      email,
      phone: phone ?? null,
      message: message ?? null,
      userId,
    },
    select: { id: true },
  });

  // Notifications are best-effort — a failed email shouldn't drop the
  // inquiry on the floor. We swallow errors but log them server-side.
  await Promise.allSettled([
    sendVrInquiryAdminEmail({
      inquiryId: inquiry.id,
      productLabel: product.product.label,
      contactName,
      email,
      phone,
      message,
      config: sanitizedConfig,
    }),
    sendVrInquiryCustomerEmail({
      to: email,
      contactName,
      productLabel: product.product.label,
    }),
  ]);

  return { ok: true, inquiryId: inquiry.id };
}

// ─── Admin actions ─────────────────────────────────────────

export async function updateVrInquiryStatus(
  inquiryId: string,
  status: "pending" | "in_progress" | "converted" | "closed",
): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nemate pristup." };
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) return { error: "Nemate pristup." };

  await prisma.vrInquiry.update({
    where: { id: inquiryId },
    data: {
      status,
      reviewedAt: status === "pending" ? null : new Date(),
    },
  });
  revalidatePath("/portal/admin/vr-upiti");
  return { ok: true };
}

// Convert a VR inquiry into a real Order in awaiting_payment status.
// Used after the team has held the consultation and agreed scope+price
// with the customer. The inquiry's contact info becomes (or finds) the
// User; the inquiry's configJson rides along on the new OrderItem so
// the team can reference it later. Customer gets a portal-access email
// with a magic link + payment CTA.
export type ConvertInquiryResult =
  | { ok: true; orderId: string; orderNumber: string }
  | { error: string };

export async function convertVrInquiryToOrder(args: {
  inquiryId: string;
  priceEur: number;
  projectName?: string;
}): Promise<ConvertInquiryResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nemate pristup." };
  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });
  if (!admin?.isAdmin) return { error: "Nemate pristup." };

  const priceEur = Math.round(Number(args.priceEur));
  if (!Number.isFinite(priceEur) || priceEur <= 0) {
    return { error: "Cena mora biti veća od 0." };
  }

  const inquiry = await prisma.vrInquiry.findUnique({
    where: { id: args.inquiryId },
  });
  if (!inquiry) return { error: "Upit nije pronađen." };
  if (inquiry.convertedOrderId) {
    return { error: "Upit je već konvertovan u order." };
  }

  const productLookup = getConfiguratorProduct(inquiry.productId);
  if (!productLookup) {
    return { error: "Nepoznata VR usluga u upitu." };
  }
  const { product, category } = productLookup;

  const config: VrConfig = sanitizeVrConfig(inquiry.configJson as VrConfig);
  const projectName =
    args.projectName?.trim() || config.projectName || product.label;

  // Find or create the customer user. Inquiry's userId takes priority
  // (set when the customer was logged in at submit time); otherwise we
  // match by email or create a passwordless guest user.
  let userId: string;
  if (inquiry.userId) {
    userId = inquiry.userId;
  } else {
    const email = inquiry.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      userId = existing.id;
    } else {
      const created = await prisma.user.create({
        data: {
          email,
          name: inquiry.contactName,
          phone: inquiry.phone ?? null,
        },
        select: { id: true },
      });
      userId = created.id;
    }
  }

  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId,
        projectName,
        status: "awaiting_payment",
        totalEur: priceEur,
        items: {
          create: [
            {
              productId: inquiry.productId,
              categoryId: category.id,
              productLabel: product.label,
              categoryLabel: category.label,
              basePriceEur: priceEur,
              totalEur: priceEur,
              addOnsJson: [],
              originalTotalEur: priceEur,
              discountPct: 0,
              discountReason: null,
              configJson: config as unknown as object,
            },
          ],
        },
        statusEvents: {
          create: [
            {
              fromStatus: null,
              toStatus: "draft",
              note: `Konvertovano iz VR upita ${inquiry.id}`,
              actorId: session.user!.id,
            },
            {
              fromStatus: "draft",
              toStatus: "awaiting_payment",
              note: "Tim je dogovorio opseg i cenu",
              actorId: session.user!.id,
            },
          ],
        },
      },
      select: { id: true, orderNumber: true },
    });

    await tx.vrInquiry.update({
      where: { id: inquiry.id },
      data: {
        status: "converted",
        convertedOrderId: created.id,
        reviewedAt: new Date(),
      },
    });

    return created;
  });

  // Issue a one-shot portal-access token so the customer can land
  // straight on the order without having to log in.
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: inquiry.email.trim().toLowerCase(),
      token,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Best-effort email; failure shouldn't roll back the order.
  void sendVrProjectReadyEmail({
    to: inquiry.email,
    contactName: inquiry.contactName,
    productLabel: product.label,
    projectName,
    priceEur,
    orderNumber: order.orderNumber,
    orderId: order.id,
    token,
  }).catch((e) => {
    // Order is already created at this point — failed email means the
    // customer can't reach the payment link without admin intervention.
    Sentry.captureException(e, {
      tags: { area: "email", template: "vr_project_ready" },
      extra: {
        inquiryId: inquiry.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        recipient: inquiry.email,
      },
    });
  });

  revalidatePath("/portal/admin/vr-upiti");
  return { ok: true, orderId: order.id, orderNumber: order.orderNumber };
}
