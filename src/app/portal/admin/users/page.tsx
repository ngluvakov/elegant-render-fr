import type { Metadata } from "next";
import Link from "next/link";
import { Search, Sparkles, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatCreditsFromUnits } from "@/lib/ai-studio/catalog";
import { requirePermission } from "@/lib/admin-auth";
import {
  ADMIN_PRESET_LABELS,
  inferAdminPreset,
  normalizeAdminPermissions,
} from "@/lib/admin-permissions";

export const metadata: Metadata = {
  title: "Admin — Users",
  description:
    "Admin user overview, account search, roles, and basic activity data.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ q?: string }>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission("USERS_VIEW");
  const { q } = await searchParams;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      canManageFinance: true,
      adminPermissions: true,
      aiCreditBalanceUnits: true,
      aiCreditsExpireAt: true,
      lastActiveAt: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search, view AI credit balance, and client history.
        </p>
      </div>

      <form className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or email..."
          className="h-9 w-full rounded-lg border border-input bg-card/80 pl-8 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </form>

      <p className="text-xs text-muted-foreground">
        {users.length} {users.length === 1 ? "user" : "users"}
        {q && " for the selected query"}
      </p>

      <div className="space-y-1.5">
        <div className="hidden grid-cols-[2fr_1.4fr_1fr_0.6fr_0.8fr_auto] gap-3 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
          <span>User</span>
          <span>Email</span>
          <span>AI credits</span>
          <span className="text-center">Orders</span>
          <span>Registered</span>
          <span className="w-16">Action</span>
        </div>

        {users.length === 0 && (
          <div className="rounded-xl border border-border/30 bg-card/60 px-6 py-8 text-center text-sm text-muted-foreground">
            No results.
          </div>
        )}

        {users.map((user) => {
          const permissions = normalizeAdminPermissions(user.adminPermissions, {
            isAdmin: user.isAdmin,
          });
          const preset = inferAdminPreset(permissions);
          return (
            <Link
              key={user.id}
              href={`/portal/admin/users/${user.id}`}
              className="block rounded-xl border border-border/30 bg-card/80 px-4 py-3 transition-all hover:border-border hover:shadow-[0_4px_16px_rgba(28,26,25,0.04)] lg:grid lg:grid-cols-[2fr_1.4fr_1fr_0.6fr_0.8fr_auto] lg:items-center lg:gap-3"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {user.name ?? "—"}
                </p>
                {permissions.length > 0 && (
                  <Badge className="gap-1 bg-accent/10 text-accent">
                    <ShieldCheck className="h-3 w-3" />
                    {ADMIN_PRESET_LABELS[preset]}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground lg:mt-0">
                {user.email}
              </p>
              <div className="mt-1 flex items-center gap-1 text-xs lg:mt-0">
                <Sparkles className="h-3 w-3 text-[color:var(--color-sage-deep)]" />
                <span className="font-medium text-foreground">
                  {formatCreditsFromUnits(user.aiCreditBalanceUnits)}
                </span>
                {user.aiCreditsExpireAt && user.aiCreditBalanceUnits > 0 && (
                  <span className="text-muted-foreground">
                    · do {user.aiCreditsExpireAt.toLocaleDateString("en-GB")}
                  </span>
                )}
              </div>
              <p className="mt-1 text-center text-xs text-muted-foreground lg:mt-0">
                {user._count.orders}
              </p>
              <p className="mt-1 text-xs text-muted-foreground lg:mt-0">
                {user.lastActiveAt
                  ? `Aktivan ${user.lastActiveAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}`
                  : user.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
              </p>
              <span className="hidden w-16 text-xs font-medium text-accent lg:block">
                Open →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
