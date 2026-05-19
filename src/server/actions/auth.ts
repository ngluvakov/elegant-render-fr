/**
 * auth.ts — Auth server actions (signup, signin, forgot/reset password, verify email).
 *
 * Exports form actions consumed by auth pages: signUpAction, signInAction,
 * forgotPasswordAction, resetPasswordAction, verifyEmailAction.
 *
 * Used by: sign-in-form, sign-up-form, forgot-password-form,
 *          reset-password-form, verifikacija page
 */
"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { sanitizeAuthCallback } from "@/lib/auth-redirect";
import { prisma } from "@/lib/db";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/email";
import { enqueueOutboxEvent } from "@/lib/outbox";

export type AuthState = {
  error?: string;
  success?: boolean;
  message?: string;
};

// ─── Helpers ─────────────────────────────────────────────

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// ─── Sign Up ─────────────────────────────────────────────

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const callbackUrl = sanitizeAuthCallback(formData.get("callbackUrl"));

  if (!name || !email || !password) {
    return { error: "Sva polja su obavezna." };
  }

  if (password.length < 8) {
    return { error: "Lozinka mora imati najmanje 8 karaktera." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Nalog sa ovom email adresom već postoji." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  // Send verification email
  const token = generateToken();
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  });

  try {
    await sendVerificationEmail(email, token);
  } catch {
    // Don't block signup if email fails
  }

  // Auto sign-in after registration
  await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  redirect(callbackUrl);
}

// ─── Sign In ─────────────────────────────────────────────

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const callbackUrl = sanitizeAuthCallback(formData.get("callbackUrl"));

  if (!email || !password) {
    return { error: "Email i lozinka su obavezni." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch {
    return { error: "Pogrešan email ili lozinka." };
  }

  redirect(callbackUrl);
}

// ─── Forgot Password ────────────────────────────────────

export async function forgotPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { error: "Email adresa je obavezna." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) {
    return {
      success: true,
      message: "Ako nalog postoji, poslali smo link za resetovanje lozinke.",
    };
  }

  const token = generateToken();
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1h
    },
  });

  try {
    await sendPasswordResetEmail(email, token);
  } catch {
    return { error: "Greška pri slanju emaila. Pokušajte ponovo." };
  }

  return {
    success: true,
    message: "Ako nalog postoji, poslali smo link za resetovanje lozinke.",
  };
}

// ─── Reset Password ─────────────────────────────────────

export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  if (!token || !password) {
    return { error: "Sva polja su obavezna." };
  }

  if (password.length < 8) {
    return { error: "Lozinka mora imati najmanje 8 karaktera." };
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    return { error: "Link je istekao ili je nevažeći. Zatražite novi." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { passwordHash },
  });

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
      },
    },
  });

  redirect("/prijava");
}

// ─── Portal Access (post-checkout magic link) ──────────

export async function requestPortalAccessAction(
  orderId: string,
): Promise<AuthState> {
  if (!orderId) {
    return { error: "Porudžbina nije pronađena." };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order || !order.user.email) {
    return { error: "Porudžbina nije pronađena." };
  }

  const token = generateToken();
  await prisma.verificationToken.create({
    data: {
      identifier: order.user.email,
      token,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Enqueue via outbox so transient Resend outages don't lose the
  // magic-link mail. Idempotency key includes the token hash so a
  // newly-issued token (e.g. user clicked "Pošalji ponovo") gets its
  // own row instead of being deduped against the previous one.
  await enqueueOutboxEvent({
    type: "portal_access_email",
    payload: {
      to: order.user.email,
      token,
      orderNumber: order.orderNumber,
      orderId: order.id,
    },
    idempotencyKey: `portal_access:${order.id}:${token.slice(0, 16)}`,
  });

  return {
    success: true,
    message: "Poslali smo vam link za pristup portalu na email.",
  };
}

export async function magicLinkSignInAction(
  formData: FormData,
): Promise<void> {
  const token = formData.get("token") as string;
  const next = (formData.get("next") as string) || "/portal";

  if (!token) {
    redirect("/prijava?error=link_invalid");
  }

  try {
    await signIn("magic-link", {
      token,
      redirect: false,
    });
  } catch {
    redirect("/prijava?error=link_expired");
  }

  redirect(next);
}

// ─── Verify Email ────────────────────────────────────────

export async function verifyEmailAction(token: string): Promise<AuthState> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    return { error: "Link za verifikaciju je istekao ili je nevažeći." };
  }

  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
      },
    },
  });

  return { success: true, message: "Email je uspešno potvrđen." };
}
