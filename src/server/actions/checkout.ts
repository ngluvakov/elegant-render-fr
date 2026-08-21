/**
 * checkout.ts — Guest user creation for anonymous checkout flow.
 *
 * Exports ensureCheckoutUser() which finds or creates a passwordless
 * guest user and sends a password-setup email for later account claim.
 *
 * Used by: poruci/steps/step-details
 */
"use server";

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export type CheckoutUserResult = {
  error?: string;
  userId?: string;
  isExisting?: boolean;
};

export async function ensureCheckoutUser(
  name: string,
  email: string,
): Promise<CheckoutUserResult> {
  if (!name || !email) {
    return { error: "Le nom et l’adresse e-mail sont requis." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    if (existing.passwordHash) {
      return {
        error: "Un compte avec cette adresse e-mail existe déjà. Connectez-vous pour continuer.",
        isExisting: true,
      };
    }
    // Existing guest user — reuse
    return { userId: existing.id };
  }

  // Create guest user (no password). Upsert instead of create: a double
  // submit would hit unique(email) on create and return a 500 instead of
  // reusing the same guest (Prisma uses an atomic
  // INSERT ... ON CONFLICT here).
  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {},
    create: { name, email: normalizedEmail },
  });

  // Send password setup email
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  try {
    await sendPasswordResetEmail(normalizedEmail, token);
  } catch {
    // Don't block checkout
  }

  return { userId: user.id };
}
