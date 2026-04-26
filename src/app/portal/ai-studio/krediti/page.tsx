import type { Metadata } from "next";
import { AiCreditPurchaseClient } from "./purchase-client";

export const metadata: Metadata = {
  title: "AI krediti",
  robots: { index: false, follow: false },
};

export default function AiStudioCreditsPage() {
  return <AiCreditPurchaseClient />;
}
