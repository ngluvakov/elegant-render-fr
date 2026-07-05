import type { Metadata } from "next";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PortalLayoutShell } from "@/components/portal/portal-layout-shell";
import { PostHogIdentifyBridge } from "@/components/posthog-identify-bridge";
import { ChatWidget } from "@/components/chat/chat-widget";
import { normalizeAdminPermissions } from "@/lib/admin-permissions";
import { recordUserActivity } from "@/lib/user-activity";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  robots: NO_INDEX_ROBOTS,
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isAdmin: true,
      adminPermissions: true,
      passwordHash: true,
    },
  });
  const adminPermissions = normalizeAdminPermissions(user?.adminPermissions, {
    isAdmin: user?.isAdmin,
  });
  // after(): upis aktivnosti ne sme da blokira render — izvršava se kad
  // odgovor završi streaming (serverless-bezbedno, za razliku od golog
  // fire-and-forget promisa koji bi Vercel mogao da ubije).
  const visitorId = session.user.id;
  after(() => recordUserActivity(visitorId, { portalVisits: 1 }).catch(() => {}));

  return (
    <PortalLayoutShell
      userName={session.user.name ?? "Korisnik"}
      userEmail={session.user.email ?? ""}
      adminPermissions={adminPermissions}
      hasPassword={Boolean(user?.passwordHash)}
    >
      <PostHogIdentifyBridge
        userId={session.user.id}
        traits={{
          email: session.user.email ?? undefined,
          name: session.user.name ?? undefined,
          isAdmin: adminPermissions.length > 0,
        }}
      />
      {children}
      <ChatWidget />
    </PortalLayoutShell>
  );
}
