/**
 * posthog-events.ts — Type-safe event names + properties for client
 * and server PostHog captures. Single source of truth for the funnel
 * we measure: cart → checkout → payment, plus VR consultation +
 * catalog feature signals.
 *
 * Adding a new event: extend `EventMap` with the event name + its
 * properties shape. The `track()` and `captureServerEvent()` helpers
 * below pick up the new shape automatically.
 *
 * Naming: snake_case events, descriptive past tense (`order_created`,
 * not `create_order`). Booleans as `was_*` (`was_inquiry`). Currencies
 * suffixed `_eur`. Counts suffixed `_count`. Avoid PII.
 */
import posthog from "posthog-js";

// ─── Event schema ────────────────────────────────────────

export type EventMap = {
  // Cart / quote
  quote_started: { product_id: string; category_id: string };
  service_added: {
    product_id: string;
    category_id: string;
    cart_size_after: number;
    source_mode?: string;
  };
  service_removed: { product_id: string; cart_size_after: number };
  quote_saved: { cart_size: number; total_eur: number };
  quote_loaded_from_share: { cart_size: number; token_age_days?: number };

  // Checkout / payment
  checkout_started: { cart_size: number; total_eur: number };
  payment_started: { provider: "paypal" | "card_mock"; total_eur: number };
  payment_completed: {
    provider: "paypal" | "card_mock";
    total_eur: number;
    order_number: string;
    was_inquiry?: boolean;
  };
  payment_failed: {
    provider: "paypal" | "card_mock";
    error_kind: string;
  };
  order_created: {
    order_number: string;
    total_eur: number;
    item_count: number;
  };

  // VR consultation flow
  vr_inquiry_submitted: {
    product_id: string;
    experience_type: string;
    target_device: string;
  };
  vr_inquiry_converted: {
    inquiry_id: string;
    order_number: string;
    price_eur: number;
  };

  // Catalog feature signals (validate per-PR effectiveness)
  staging_type_swapped: { from: "vs-static" | "vs-360"; to: "vs-static" | "vs-360" };
  anim_source_mode_picked: {
    mode: "scratch" | "existing" | "active";
    where: "cene" | "configurator";
  };

  // Admin operational signals (server-side)
  admin_credits_granted: { user_id: string; units: number };
  admin_free_revision_granted: { order_id: string; from_status: string };
  admin_charge_requested: {
    order_id: string;
    charge_id: string;
    total_cents: number;
    item_count: number;
  };
  additional_charge_paid: {
    charge_id: string;
    order_id: string;
    total_cents: number;
    provider: "paypal" | "card_mock";
  };
};

export type EventName = keyof EventMap;

// ─── Client capture ──────────────────────────────────────

// `track` — call from any client component / server-action callback.
// No-op when posthog isn't initialized (env missing in dev).
export function track<E extends EventName>(
  event: E,
  properties: EventMap[E],
): void {
  if (typeof window === "undefined") return;
  // posthog-js exposes `posthog.capture(event, props)` — when init
  // skipped (no env), the lib is a stub and these calls do nothing.
  posthog.capture(event, properties as Record<string, unknown>);
}
