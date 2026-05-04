import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SessionProvider } from "@/components/auth/session-provider";
import { PostHogIdentifyBridge } from "@/components/posthog-identify-bridge";
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
  // Server-resolve session so authenticated users browsing marketing
  // pages (e.g. logged-in customer revisiting /cene) are identified
  // in PostHog from the first pageview, not just after they cross
  // into /portal.
  const [session, displayCurrency, pricingCatalog] = await Promise.all([
    auth(),
    getPublicDisplayCurrency(),
    getPublishedPricingCatalog(),
  ]);

  return (
    <SessionProvider>
      <PostHogIdentifyBridge
        userId={session?.user?.id ?? null}
        traits={{
          email: session?.user?.email ?? undefined,
          name: session?.user?.name ?? undefined,
        }}
      />
      <PublicCurrencyProvider
        displayCurrency={displayCurrency}
        pricingSettings={pricingCatalog.settings}
      >
        <QuickInquiryProvider>
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <SiteFooter />
          <ChatWidget />
        </QuickInquiryProvider>
      </PublicCurrencyProvider>
    </SessionProvider>
  );
}
