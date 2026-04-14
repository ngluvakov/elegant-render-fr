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
    return { error: "Ime i email su obavezni." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    if (existing.passwordHash) {
      return {
        error: "Nalog sa ovim emailom već postoji. Prijavite se da nastavite.",
        isExisting: true,
      };
    }
    // Existing guest user — reuse
    return { userId: existing.id };
  }

  // Create guest user (no password)
  const user = await prisma.user.create({
    data: { name, email: normalizedEmail },
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
