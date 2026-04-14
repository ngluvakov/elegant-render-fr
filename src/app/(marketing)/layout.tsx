import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SessionProvider } from "@/components/auth/session-provider";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </SessionProvider>
  );
}
