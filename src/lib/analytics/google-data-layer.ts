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

export type GoogleLeadDataLayerEvent = {
  event: "er_generate_lead";
  event_id: string;
  lead_type: "project_inquiry" | "quick_inquiry" | "vr_inquiry";
  source_path?: string;
  conversion_source?: string;
  product_id?: string;
  file_count?: number;
  has_quote_snapshot?: boolean;
  experience_type?: string;
  target_device?: string;
};

export type GoogleCommerceDataLayerEvent = {
  event: "er_begin_checkout";
  event_id: string;
  value: number;
  currency: GoogleConversionCurrency;
  transaction_value: number;
  transaction_currency: GoogleConversionCurrency;
  items: GoogleDataLayerItem[];
  source_path?: string;
  conversion_source?: string;
};

export type GooglePurchaseDataLayerEvent = {
  event: "er_purchase";
  event_id: string;
  transaction_id: string;
  value: number;
  currency: GoogleConversionCurrency;
  transaction_value: number;
  transaction_currency: GoogleConversionCurrency;
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

  return {
    event: "er_begin_checkout",
    event_id: `begin_checkout:${Date.now()}`,
    value,
    currency: "EUR",
    transaction_value: value,
    transaction_currency: "EUR",
    items: calculation.items.map(quoteItemToDataLayerItem),
    ...(sourcePath ? { source_path: sourcePath } : {}),
    conversion_source: conversionSource,
  };
}
