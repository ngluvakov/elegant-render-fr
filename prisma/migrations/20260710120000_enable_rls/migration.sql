-- Enable Row Level Security on every public table so the Supabase Data API
-- (PostgREST; the `anon`/`authenticated` roles) cannot read any row. The app
-- is unaffected: Prisma connects as the `postgres` role (which owns these
-- tables AND has the BYPASSRLS attribute) and Supabase Storage uses the
-- service-role key (also BYPASSRLS). No policies are created — deny-by-default
-- is intentional; the application never uses the Data API (all data access is
-- Prisma over a direct Postgres connection; supabase-js is storage-only).
--
-- IMPORTANT: plain ENABLE, never FORCE. FORCE would strip the owner's bypass
-- and, with no policies, return zero rows to Prisma → total app outage.
--
-- Remediates Supabase linter `rls_disabled_in_public` (all tables) and
-- `sensitive_columns_exposed` (accounts.access_token/refresh_token,
-- verification_tokens.token). See docs note on disabling the Data API for the
-- root-cause, future-table-proof measure.
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_usage_daily" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."verification_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_status_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_charges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_charge_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."payment_webhook_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bitrix_sync_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."quotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_credit_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_generations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_generation_reference_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."chat_feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."project_inquiries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."project_inquiry_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pricing_books" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pricing_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pricing_add_ons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pricing_discount_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pricing_duration_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pricing_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pricing_change_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."invoice_counters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."proforma_counters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."outbox_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."vr_inquiries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
