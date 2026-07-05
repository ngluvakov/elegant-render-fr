/**
 * upsell-helpers.ts — Display-only helpers for computing upsell discount
 * badges on the /pricing tablice and the related-services postcard.
 *
 * Builds correctly-shaped synthetic QuoteItems so resolveDiscount() can be
 * called from a browse context (no real cart commit) without crashing on
 * conditional consume rules.
 *
 * Calculator is NOT modified — these helpers wrap existing public APIs.
 */

import {
  CONFIGURATOR_CATEGORIES,
  type ConfiguratorProduct,
  getConfiguratorProduct,
} from "./configurator";
import { type QuoteItem } from "./calculate";
import {
  filterUnaddedRelated,
  getRelatedProductIds,
} from "./product-relations";

const PRIMARY_INSTANCE_ID = "__upsell-primary__";
const TARGET_INSTANCE_ID = "__upsell-target__";

/**
 * Build a fully-typed synthetic QuoteItem representing the "primary" the
 * customer is viewing in a tablica context. resolveDiscount uses it as a
 * sibling when calculating upsell discounts for related products.
 */
export function makePrimaryItem(productId: string): QuoteItem {
  const categoryId =
    CONFIGURATOR_CATEGORIES.find((c) =>
      c.products.some((p) => p.id === productId),
    )?.id ?? "unknown";
  return {
    instanceId: PRIMARY_INSTANCE_ID,
    productId,
    categoryId,
    addOnQuantities: {},
  };
}

/**
 * Build a fully-typed synthetic target item for an upsell discount call.
 * Required so conditionSatisfied (calculate.ts:364) can read
 * target.addOnQuantities without throwing.
 */
export function makeUpsellTargetItem(productId: string): QuoteItem {
  const categoryId =
    CONFIGURATOR_CATEGORIES.find((c) =>
      c.products.some((p) => p.id === productId),
    )?.id ?? "unknown";
  return {
    instanceId: TARGET_INSTANCE_ID,
    productId,
    categoryId,
    addOnQuantities: {},
  };
}

/**
 * Resolve the list of upsell products to surface beneath a primary product
 * in a tablica. Filters out anything already in cart and anything that
 * requires consultation (VR walkthroughs); also drops the primary itself.
 */
export function getUpsellProducts(
  primaryProductId: string,
  cartItems: ReadonlyArray<{ productId: string }>,
): ConfiguratorProduct[] {
  const cartProductIds = new Set(cartItems.map((i) => i.productId));
  cartProductIds.add(primaryProductId);
  const relatedIds = getRelatedProductIds(primaryProductId);
  const notInCart = filterUnaddedRelated(relatedIds, cartProductIds);
  return notInCart
    .map((id) => getConfiguratorProduct(id)?.product)
    .filter(
      (p): p is ConfiguratorProduct => p !== undefined && !p.inquiryOnly,
    );
}
