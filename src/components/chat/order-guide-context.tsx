"use client";

import { useAssistantGuideContext } from "@/lib/chat/guide-context";

type OrderAssistantGuideContextProps = {
  productIds: string[];
  unconfiguredCount: number;
  hasFiles: boolean;
  canEditItems: boolean;
};

export function OrderAssistantGuideContext({
  productIds,
  unconfiguredCount,
  hasFiles,
  canEditItems,
}: OrderAssistantGuideContextProps) {
  useAssistantGuideContext({
    page: "order_detail",
    stage:
      canEditItems && unconfiguredCount > 0
        ? "missing_order_data"
        : "order_ready",
    productIds,
    unconfiguredCount,
    hasFiles,
  });

  return null;
}
