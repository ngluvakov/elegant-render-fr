import type { Metadata } from "next";
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
  if (!session?.user?.id) redirect("/prijava");

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
  await recordUserActivity(session.user.id, { portalVisits: 1 });

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
