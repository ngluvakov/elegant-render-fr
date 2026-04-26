/**
 * supabase.ts — Supabase admin client (service-role key).
 *
 * Exports getSupabaseAdmin() for server-side storage operations (file
 * uploads/downloads). Uses the service-role key to bypass RLS.
 *
 * Used by: api/portal/download, api/checkout/upload-url
 */
import { createClient } from "@supabase/supabase-js";

let supabaseAdminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (supabaseAdminClient) return supabaseAdminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase storage environment variables are not configured.");
  }

  supabaseAdminClient = createClient(url, serviceRoleKey);
  return supabaseAdminClient;
}
