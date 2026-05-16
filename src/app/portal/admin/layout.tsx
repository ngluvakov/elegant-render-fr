import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminContext();
  if (!admin) redirect("/portal");

  return <>{children}</>;
}
