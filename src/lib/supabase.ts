/**
 * supabase.ts — Supabase admin client (service-role key).
 *
 * Exports `supabaseAdmin` for server-side storage operations (file
 * uploads/downloads). Uses the service-role key to bypass RLS.
 *
 * Used by: api/portal/download, api/checkout/upload-url
 */
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
