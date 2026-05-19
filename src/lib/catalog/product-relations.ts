/**
 * product-relations.ts — Presentation-layer mapping from a primary
 * product to a list of contextually-relevant related products.
 *
 * Used by the "Uz ovaj paket:" postcard surfaced under each cart item
 * after the customer has committed to a primary service. Calculator
 * does NOT consult this file — it is display-only.
 *
 * Used by: components/configurator/related-services-postcard (Davenport),
 *          chat ProposalCard (for sectioned :::predlog blocks).
 */

const PRODUCT_RELATIONS: Record<string, string[]> = {
  // Interior renders pair naturally with floor plans, virtual tours
  // (so the buyer can navigate the same model), and animation.
  "int-static": ["fp3d-single", "int-360", "anim", "vs-static"],
  "int-360": ["int-static", "fp3d-single", "anim"],

  // Exterior renders pair with aerial views, situational plans,
  // and animation. Landscape often follows exterior commitment.
  "ext-static": ["ext-aerial", "ext-360", "anim", "land-static"],
  "ext-360": ["ext-static", "ext-aerial", "anim"],
  "ext-aerial": ["ext-static", "land-static", "sp-first"],

  // Landscape: pairs with exterior context and situational plans.
  "land-static": ["ext-static", "sp-first", "ext-aerial"],

  // Floor plans: low-cost adjunct, surface alongside renders.
  "fp3d-single": ["fp2d-single", "int-static", "int-360"],
  "fp2d-single": ["fp3d-single", "int-static"],

  // Site plans: the heaviest exterior product, related to renders
  // that consume terrain/exterior-shell.
  "sp-first": ["ext-static", "ext-aerial", "land-static"],

  // Animation surfaces with whatever rendering context is in cart.
  // The bot is expected to pick relevant primaries; from animation
  // itself, suggest the static counterparts so the customer can
  // also commission stills.
  anim: ["ext-static", "int-static", "ext-aerial"],

  // Virtual staging / renovation: lightweight image work — relate
  // them to one another and to a floor plan that grounds the room.
  "vs-static": ["vs-360", "reno-image", "fp2d-single"],
  "vs-360": ["vs-static", "reno-image", "int-360"],
  "reno-image": ["vs-static", "fp3d-single"],

  // Day-to-dusk and item removal: solo image work, relate to staging
  // for the wider transformation flow.
  "dtd-image": ["vs-static", "ir-simple"],
  "ir-simple": ["ir-complex", "vs-static", "dtd-image"],
  "ir-complex": ["ir-simple", "reno-image"],
};

export function getRelatedProductIds(productId: string): string[] {
  return PRODUCT_RELATIONS[productId] ?? [];
}

export function filterUnaddedRelated(
  relatedIds: string[],
  cartProductIds: ReadonlySet<string> | string[],
): string[] {
  const set =
    cartProductIds instanceof Set
      ? cartProductIds
      : new Set(cartProductIds);
  return relatedIds.filter((id) => !set.has(id));
}
