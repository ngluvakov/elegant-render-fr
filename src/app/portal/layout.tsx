import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PortalLayoutShell } from "@/components/portal/portal-layout-shell";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/prijava");

  return (
    <PortalLayoutShell
      userName={session.user.name ?? "Korisnik"}
      userEmail={session.user.email ?? ""}
    >
      {children}
    </PortalLayoutShell>
  );
}
