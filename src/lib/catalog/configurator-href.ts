/**
 * configurator-href.ts — builds /pricing deep-links that open the configurator with
 * a matching quote item already added (the `add` product) inside the right
 * category `group`. Shared by the home-page QuickOrderHero and the service-detail
 * pricing cards so the mapping lives in exactly one place.
 */

/** Service category → configurator group (left sidebar filter on /pricing). */
export const SERVICE_CATEGORY_TO_GROUP: Record<string, string> = {
  exterior: "exterior-renders",
  interior: "interior",
  plans: "plans",
  animations: "animation",
  transformation: "staging-renovation",
};

type ConfiguratorTarget = { productId?: string; sourceMode?: string };

/** Service variant id → configurator product to prefill (`add` param). */
export const VARIANT_TO_CONFIGURATOR: Record<string, ConfiguratorTarget> = {
  "interior-static": { productId: "int-static" },
  "interior-360": { productId: "int-360" },
  "exterior-static": { productId: "ext-static" },
  "exterior-360": { productId: "ext-360" },
  "exterior-aerial": { productId: "ext-aerial" },
  "staging-static": { productId: "vs-static" },
  "staging-360": { productId: "vs-360" },
  "renovation-main": { productId: "reno-image" },
  "landscape-reno": { productId: "reno-image" },
  "floorplan-2d": { productId: "fp2d-single" },
  "floorplan-3d": { productId: "fp3d-single" },
  "landscape-main": { productId: "land-static" },
  "photomontage-main": { productId: "ext-static", sourceMode: "photomontage" },
  "site-plan-main": { productId: "sp-first" },
  "day-to-dusk-main": { productId: "dtd-image" },
  "item-removal-main": { productId: "ir-simple" },
  "animation-from-scratch": { productId: "anim", sourceMode: "scratch" },
};

/**
 * Build a `/pricing` URL that opens the configurator with the matching product
 * prefilled. Unknown variant ids gracefully fall back to just opening the group.
 */
export function buildConfiguratorHref(
  variantId: string,
  serviceCategory: string,
  from = "home-hero",
) {
  const group =
    SERVICE_CATEGORY_TO_GROUP[serviceCategory] ?? "exterior-renders";
  const target = VARIANT_TO_CONFIGURATOR[variantId];
  const params = new URLSearchParams({ group });
  if (target?.productId) {
    params.set("add", target.productId);
  }
  if (target?.sourceMode) {
    params.set("sourceMode", target.sourceMode);
  }
  params.set("from", from);
  return `/pricing?${params.toString()}#configurator`;
}
