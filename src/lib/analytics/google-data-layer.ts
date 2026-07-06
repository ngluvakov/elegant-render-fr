import type { DisplayCurrency } from "@/lib/catalog/display-currency";
import type { PublicPricingFormatSettings } from "@/lib/catalog/display-currency";
import type {
  LineItemBreakdown,
  QuoteCalculation,
} from "@/lib/catalog/calculate";

export type GoogleConversionCurrency = "EUR";

export type GoogleDataLayerItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
  quantity: number;
  product_id?: string;
  category_id?: string;
  item_kind?: "service" | "ai_credits";
  ai_credit_quantity?: number;
};

// Event names + payload shapes match the live GTM container (v19):
// custom-event triggers "purchase" / "InitiateCheckout" / "generate_lead",
// GA4 tags reading the standard `ecommerce` object. Do not rename without
// updating the GTM triggers in lockstep.
export type GoogleLeadDataLayerEvent = {
  event: "generate_lead";
  event_id: string;
  value: number;
  currency: GoogleConversionCurrency;
  lead_type: "project_inquiry" | "quick_inquiry" | "vr_inquiry";
  source_path?: string;
  conversion_source?: string;
  product_id?: string;
  file_count?: number;
  has_quote_snapshot?: boolean;
  experience_type?: string;
  target_device?: string;
};

export type GoogleEcommercePayload = {
  transaction_id?: string;
  value: number;
  currency: GoogleConversionCurrency;
  items: GoogleDataLayerItem[];
};

export type GoogleCommerceDataLayerEvent = {
  event: "InitiateCheckout";
  event_id: string;
  value: number;
  currency: GoogleConversionCurrency;
  ecommerce: GoogleEcommercePayload;
  items: GoogleDataLayerItem[];
  source_path?: string;
  conversion_source?: string;
};

export type GooglePurchaseDataLayerEvent = {
  event: "purchase";
  event_id: string;
  transaction_id: string;
  value: number;
  currency: GoogleConversionCurrency;
  ecommerce: GoogleEcommercePayload;
  items: GoogleDataLayerItem[];
  payment_provider?: string | null;
  buyer_type?: string;
  contains_ai_credits?: boolean;
  source_path?: string;
  conversion_source?: string;
};

export type GoogleDataLayerEvent =
  | GoogleLeadDataLayerEvent
  | GoogleCommerceDataLayerEvent
  | GooglePurchaseDataLayerEvent;

type BuildBeginCheckoutArgs = {
  calculation: QuoteCalculation;
  displayCurrency: DisplayCurrency;
  pricingSettings?: PublicPricingFormatSettings;
  sourcePath?: string;
  conversionSource?: string;
};

export function centsToDataLayerValue(cents: number): number {
  return Number((Math.max(0, Math.round(cents)) / 100).toFixed(2));
}

function quoteItemToDataLayerItem(item: LineItemBreakdown): GoogleDataLayerItem {
  return {
    item_id: item.productId,
    item_name: item.productLabel,
    item_category: item.categoryLabel,
    price: centsToDataLayerValue(item.totalCents),
    quantity: 1,
    product_id: item.productId,
    item_kind: item.kind,
    ...(item.aiCreditQuantity
      ? { ai_credit_quantity: item.aiCreditQuantity }
      : {}),
  };
}

export function buildBeginCheckoutDataLayerEvent({
  calculation,
  sourcePath,
  conversionSource = "quote_summary",
}: BuildBeginCheckoutArgs): GoogleCommerceDataLayerEvent {
  const value = centsToDataLayerValue(calculation.totalCents);
  const items = calculation.items.map(quoteItemToDataLayerItem);

  return {
    event: "InitiateCheckout",
    event_id: `begin_checkout:${Date.now()}`,
    value,
    currency: "EUR",
    ecommerce: { value, currency: "EUR", items },
    items,
    ...(sourcePath ? { source_path: sourcePath } : {}),
    conversion_source: conversionSource,
  };
}
