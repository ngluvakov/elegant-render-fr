/**
 * profile.ts — Server action for updating the authenticated user's profile.
 *
 * Exports updateProfileAction() handling name, phone, and optional
 * password change with bcrypt hashing.
 *
 * Used by: portal/profil/profile-form
 */
"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  if (!name) return { error: "Ime je obavezno." };

  const data: Record<string, unknown> = { name, phone };

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

  return { success: true };
}
