import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PortalLayoutShell } from "@/components/portal/portal-layout-shell";
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
    select: { isAdmin: true },
  });

  return (
    <PortalLayoutShell
      userName={session.user.name ?? "Korisnik"}
      userEmail={session.user.email ?? ""}
      isAdmin={user?.isAdmin ?? false}
    >
      {children}
      <ChatWidget />
    </PortalLayoutShell>
  );
}
