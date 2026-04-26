/**
 * quote.ts — Save and load shareable quote snapshots.
 *
 * Exposes:
 *   - saveQuote(items)   → creates a Quote row, returns { token }.
 *     Token is the cuid id; share URL is /cene?q=<token>.
 *   - loadQuote(token)   → returns { items } if token valid + not expired.
 *     Stamps openedAt for analytics.
 *
 * Quotes expire after 30 days. Item count is capped at 50 to avoid
 * pathological payloads. Both actions are unauthenticated — guests can
 * save their cart and share it before checking out.
 */
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { QuoteItem } from "@/lib/catalog/calculate";
import { getConfiguratorProduct } from "@/lib/catalog/configurator";

const QUOTE_TTL_DAYS = 30;
const MAX_ITEMS = 50;

export type SaveQuoteResult = { token: string } | { error: string };
export type LoadQuoteResult = { items: QuoteItem[] } | { error: string };

function sanitizeItems(input: unknown): QuoteItem[] | null {
  if (!Array.isArray(input)) return null;
  if (input.length === 0 || input.length > MAX_ITEMS) return null;

  const out: QuoteItem[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const productId = typeof r.productId === "string" ? r.productId : null;
    const categoryId = typeof r.categoryId === "string" ? r.categoryId : null;
    if (!productId || !categoryId) return null;
    if (!getConfiguratorProduct(productId)) return null;

    const addOnQuantities: Record<string, number> = {};
    if (r.addOnQuantities && typeof r.addOnQuantities === "object") {
      for (const [k, v] of Object.entries(
        r.addOnQuantities as Record<string, unknown>,
      )) {
        if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
          addOnQuantities[k] = Math.floor(v);
        }
      }
    }

    const durationSeconds =
      typeof r.durationSeconds === "number" && Number.isFinite(r.durationSeconds)
        ? Math.max(0, Math.floor(r.durationSeconds))
        : undefined;

    out.push({
      instanceId:
        typeof r.instanceId === "string" && r.instanceId
          ? r.instanceId
          : crypto.randomUUID(),
      productId,
      categoryId,
      addOnQuantities,
      ...(durationSeconds !== undefined ? { durationSeconds } : {}),
    });
  }
  return out;
}

export async function saveQuote(items: unknown): Promise<SaveQuoteResult> {
  const sanitized = sanitizeItems(items);
  if (!sanitized) {
    return { error: "Ponuda je prazna ili neispravna." };
  }

  const session = await auth();
  const expiresAt = new Date(Date.now() + QUOTE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const quote = await prisma.quote.create({
    data: {
      itemsJson: sanitized,
      userId: session?.user?.id ?? null,
      expiresAt,
    },
    select: { id: true },
  });

  return { token: quote.id };
}

export async function loadQuote(token: unknown): Promise<LoadQuoteResult> {
  if (typeof token !== "string" || !token) {
    return { error: "Nevažeći token." };
  }

  const quote = await prisma.quote.findUnique({
    where: { id: token },
    select: { itemsJson: true, expiresAt: true },
  });

  if (!quote) {
    return { error: "Ponuda ne postoji ili je istekla." };
  }
  if (quote.expiresAt < new Date()) {
    return { error: "Ova ponuda je istekla." };
  }

  const items = sanitizeItems(quote.itemsJson);
  if (!items) {
    return { error: "Sadržaj ponude je oštećen." };
  }

  // Stamp openedAt (best-effort; ignore failures)
  void prisma.quote
    .update({ where: { id: token }, data: { openedAt: new Date() } })
    .catch(() => {});

  return { items };
}
