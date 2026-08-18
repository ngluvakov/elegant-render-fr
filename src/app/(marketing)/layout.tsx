import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { BackToTop } from "@/components/site/back-to-top";
import { SessionProvider } from "@/components/auth/session-provider";
import { PostHogSessionBridge } from "@/components/posthog-session-bridge";
import { ChatWidget } from "@/components/chat/chat-widget";
import { QuickInquiryProvider } from "@/components/inquiry/quick-inquiry-provider";
import { PublicCurrencyProvider } from "@/components/site/public-currency-provider";
import { getPublicDisplayCurrency } from "@/lib/catalog/public-currency-server";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The session is deliberately NOT read here (auth() would opt the whole
  // marketing tree into per-request rendering because of cookies) — PostHog
  // identification happens client-side through PostHogSessionBridge.
  const [displayCurrency, pricingCatalog] = await Promise.all([
    getPublicDisplayCurrency(),
    getPublishedPricingCatalog(),
  ]);

  return (
    <SessionProvider>
      <PostHogSessionBridge />
      <PublicCurrencyProvider
        displayCurrency={displayCurrency}
        pricingSettings={pricingCatalog.settings}
      >
        <QuickInquiryProvider>
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <SiteFooter />
          <ChatWidget />
          <BackToTop />
        </QuickInquiryProvider>
      </PublicCurrencyProvider>
    </SessionProvider>
  );
}
