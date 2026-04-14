/**
 * sign-out.ts — Server action to sign the user out and redirect to home.
 *
 * Exports signOutAction() which wraps Auth.js signOut with redirectTo: "/".
 *
 * Used by: portal-sidebar, sign-out-button
 */
"use server";

import { signOut } from "@/lib/auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
