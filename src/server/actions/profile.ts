/**
 * profile.ts — Server actions for the authenticated user's profile.
 *
 * Exports:
 *   - updateProfileAction()         — name / phone / password change
 *   - requestAccountDeletion()      — GDPR Art. 17 erasure request
 *   - cancelAccountDeletion()       — undo the request
 *
 * Account deletion is request-based (not auto-delete) because the
 * Zakon o računovodstvu requires keeping invoice/order rows for 10
 * years. Admin processes the request by anonymizing PII while
 * preserving the accounting-required rows. Until processed the user
 * sees a "deletion pending" banner and can cancel.
 *
 * Used by: portal/profil/profile-form, portal/profil/privacy-actions
 */
"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import {
  buyerTypeForBilling,
  normalizeCountryCode,
} from "@/lib/billing";
import { validateBuyerInfo } from "@/lib/buyer-validation";

export type ProfileState = {
  error?: string;
  success?: boolean;
};

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string) || null;
  const newPassword = formData.get("newPassword") as string;
  const billingKind = formData.get("billingKind") as string;
  const billingCountryCode = normalizeCountryCode(
    formData.get("billingCountryCode") as string,
    "RS",
  );
  const billingBuyerType = buyerTypeForBilling(
    billingKind === "company" ? "company" : "individual",
    billingCountryCode,
  );
  const companyName = ((formData.get("billingCompanyName") as string) || "").trim();
  const companyTaxId = ((formData.get("billingCompanyTaxId") as string) || "")
    .trim()
    .toUpperCase();
  const companyMb = ((formData.get("billingCompanyMb") as string) || "").trim();
  const companyAddress = ((formData.get("billingCompanyAddress") as string) || "")
    .trim();

  if (!name) return { error: "Ime je obavezno." };

  const buyerError = validateBuyerInfo({
    buyerType: billingBuyerType,
    buyerCountryCode: billingCountryCode,
    companyName,
    companyTaxId,
    companyMb,
    companyAddress,
    companyCountryCode:
      billingBuyerType === "company_foreign" ? billingCountryCode : null,
  });
  if (buyerError) return { error: buyerError };

  const data: Record<string, unknown> = { name, phone };
  data.billingBuyerType = billingBuyerType;
  data.billingCountryCode = billingCountryCode;
  data.billingCompanyName =
    billingBuyerType === "individual" ? null : companyName;
  data.billingCompanyTaxId =
    billingBuyerType === "individual" ? null : companyTaxId;
  data.billingCompanyMb =
    billingBuyerType === "company_rs" && companyMb ? companyMb : null;
  data.billingCompanyAddress =
    billingBuyerType === "individual" ? null : companyAddress;

  if (newPassword) {
    if (newPassword.length < 8) {
      return { error: "Nova lozinka mora imati najmanje 8 karaktera." };
    }
    data.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  await recordAuditLog({
    action: "profile.billing_update",
    entityType: "User",
    entityId: session.user.id,
    metadata: {
      buyerType: billingBuyerType,
      countryCode: billingCountryCode,
      hasCompanyTaxId: Boolean(
        billingBuyerType !== "individual" && companyTaxId,
      ),
      hasCompanyMb: Boolean(billingBuyerType === "company_rs" && companyMb),
    },
  });

  revalidatePath("/portal/profil");
  revalidatePath("/poruci");

  return { success: true };
}

export type DeletionState = {
  error?: string;
  success?: boolean;
};

/**
 * Mark the user's account as pending deletion. Sets deletionRequestedAt
 * to now, fires an outbox email to admins (DPO inbox), and records an
 * audit log. The actual erasure (PII anonymization while preserving
 * accounting rows) is performed by an admin within 30 days.
 */
export async function requestAccountDeletion(): Promise<DeletionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, deletionRequestedAt: true },
  });
  if (!user) return { error: "Korisnik nije pronađen." };
  if (user.deletionRequestedAt) {
    return {
      error:
        "Zahtev za brisanje je već registrovan. Pratite status na stranici profila.",
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { deletionRequestedAt: new Date() },
  });

  // Admin notification path: the audit log entry below is reviewable
  // at /portal/admin/revizije by filtering on action=account.deletion_request.
  // A dedicated email-to-DPO channel can be wired later by adding
  // account_deletion_requested_email to OutboxEventType.
  await recordAuditLog({
    action: "account.deletion_request",
    entityType: "User",
    entityId: session.user.id,
    metadata: { userEmail: user.email, userName: user.name ?? null },
  });

  revalidatePath("/portal/profil");
  return { success: true };
}

export async function cancelAccountDeletion(): Promise<DeletionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Niste prijavljeni." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { deletionRequestedAt: true, email: true },
  });
  if (!user?.deletionRequestedAt) {
    return { error: "Nema aktivnog zahteva za brisanje." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { deletionRequestedAt: null },
  });

  await recordAuditLog({
    action: "account.deletion_cancel",
    entityType: "User",
    entityId: session.user.id,
    metadata: { userEmail: user.email },
  });

  revalidatePath("/portal/profil");
  return { success: true };
}
