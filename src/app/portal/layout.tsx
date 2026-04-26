import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PortalLayoutShell } from "@/components/portal/portal-layout-shell";
import { PostHogIdentifyBridge } from "@/components/posthog-identify-bridge";
import { ChatWidget } from "@/components/chat/chat-widget";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/prijava");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, passwordHash: true },
  });

  return (
    <PortalLayoutShell
      userName={session.user.name ?? "Korisnik"}
      userEmail={session.user.email ?? ""}
      isAdmin={user?.isAdmin ?? false}
      hasPassword={Boolean(user?.passwordHash)}
    >
      <PostHogIdentifyBridge
        userId={session.user.id}
        traits={{
          email: session.user.email ?? undefined,
          name: session.user.name ?? undefined,
          isAdmin: user?.isAdmin ?? false,
        }}
      />
      {children}
      <ChatWidget />
    </PortalLayoutShell>
  );
}
