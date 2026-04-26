/**
 * vr-inquiry.ts — Server actions for VR consultation requests.
 *
 * VR products (vr-existing, vr-standalone) bypass the cart/payment
 * flow. Customers fill a public intake form on /usluge/vr/konsultacija
 * which posts here; we sanitize, persist as VrInquiry, and notify the
 * team via email so they can schedule a meeting.
 */
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendVrInquiryAdminEmail, sendVrInquiryCustomerEmail } from "@/lib/email";
import { sanitizeVrConfig, type VrConfig, type VrProductId } from "@/lib/catalog/vr-config";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";

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
  return { ok: true };
}
