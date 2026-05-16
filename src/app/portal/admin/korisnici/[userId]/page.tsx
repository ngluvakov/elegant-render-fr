import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatEur } from "@/lib/catalog/calculate";
import {
  formatCreditsFromUnits,
  formatCents,
} from "@/lib/ai-studio/catalog";
import { statusLabel, statusAccent } from "@/components/portal/status-utils";
import { AdminGrantCreditsPanel } from "../../porudzbine/[orderId]/admin-grant-credits-panel";
import { saveUserAdminAccess } from "@/server/actions/admin-access";
import { adminHas, requirePermission } from "@/lib/admin-auth";
import {
  ADMIN_PERMISSION_LABELS,
  ADMIN_PERMISSIONS,
  ADMIN_PRESET_LABELS,
  inferAdminPreset,
  normalizeAdminPermissions,
} from "@/lib/admin-permissions";

export const metadata: Metadata = {
  title: "Admin — Korisnik",
  robots: { index: false, follow: false },
};

type Params = Promise<{ userId: string }>;

const TX_TYPE_LABEL: Record<string, string> = {
  purchase: "Kupovina",
  spend: "Potrošnja",
  refund: "Povraćaj",
  expiry: "Isticanje",
  adjustment: "Admin grant",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Params;
}) {
  const { userId } = await params;
  const admin = await requirePermission("USERS_VIEW");
  const canManageCredits = adminHas(admin, "AI_CREDITS_MANAGE");
  const canManageAdminAccess = adminHas(admin, "ADMIN_MANAGE");
  const canViewFinance = adminHas(admin, "FINANCE_VIEW");
  const canViewProjects = adminHas(admin, "PROJECTS_VIEW");
  const canViewUsage = adminHas(admin, "USAGE_VIEW");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          projectName: true,
          status: true,
          totalEur: true,
          createdAt: true,
        },
      },
      aiCreditTransactions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      usageDaily: {
        orderBy: { day: "desc" },
        take: 30,
      },
    },
  });

  if (!user) return notFound();
  const userPermissions = normalizeAdminPermissions(user.adminPermissions, {
    isAdmin: user.isAdmin,
  });
  const preset = inferAdminPreset(userPermissions);
  const usageTotals = user.usageDaily.reduce(
    (acc, day) => ({
      portalVisits: acc.portalVisits + day.portalVisits,
      ordersCreated: acc.ordersCreated + day.ordersCreated,
      aiGenerationsStarted:
        acc.aiGenerationsStarted + day.aiGenerationsStarted,
      aiCreditsSpentUnits: acc.aiCreditsSpentUnits + day.aiCreditsSpentUnits,
      aiCreditsGrantedUnits:
        acc.aiCreditsGrantedUnits + day.aiCreditsGrantedUnits,
    }),
    {
      portalVisits: 0,
      ordersCreated: 0,
      aiGenerationsStarted: 0,
      aiCreditsSpentUnits: 0,
      aiCreditsGrantedUnits: 0,
    },
  );

  return (
    <div className="space-y-6">
      <Link
        href="/portal/admin/korisnici"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Korisnici
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl text-foreground md:text-3xl">
              {user.name ?? "—"}
            </h1>
            {userPermissions.length > 0 && (
              <Badge className="gap-1 bg-accent/10 text-accent">
                <ShieldCheck className="h-3 w-3" />
                {ADMIN_PRESET_LABELS[preset]}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.email}
            {user.phone && ` · ${user.phone}`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Registrovan{" "}
            {user.createdAt.toLocaleDateString("sr-Latn-RS", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {user.lastActiveAt &&
              ` · poslednja aktivnost ${user.lastActiveAt.toLocaleDateString(
                "sr-Latn-RS",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                },
              )}`}
          </p>
        </div>
      </div>

      {canManageCredits && (
        <AdminGrantCreditsPanel
          userId={user.id}
          userName={user.name}
          userEmail={user.email}
          balanceUnits={user.aiCreditBalanceUnits}
          expiresAt={user.aiCreditsExpireAt}
        />
      )}

      {canManageAdminAccess && (
        <form
          action={saveUserAdminAccess}
          className="rounded-2xl border border-border/40 bg-card/60 p-5"
        >
          <input type="hidden" name="userId" value={user.id} />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Administrativni pristup
              </h3>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                Preset je brzi izbor, a čekirane dozvole su izvor istine za
                backend provere na stranicama, akcijama i API rutama.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <select
                name="preset"
                defaultValue={preset}
                className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground"
              >
                {(["none", "project", "finance", "user_ops", "super", "custom"] as const).map(
                  (option) => (
                    <option key={option} value={option}>
                      {ADMIN_PRESET_LABELS[option]}
                    </option>
                  ),
                )}
              </select>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {ADMIN_PERMISSIONS.map((permission) => (
                  <label
                    key={permission}
                    className="inline-flex items-center gap-2 text-xs font-medium text-foreground"
                  >
                    <input
                      type="checkbox"
                      name="adminPermissions"
                      value={permission}
                      defaultChecked={userPermissions.includes(permission)}
                      className="h-4 w-4 rounded border-border"
                    />
                    {ADMIN_PERMISSION_LABELS[permission]}
                  </label>
                ))}
              </div>
              <button
                type="submit"
                className="w-fit rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent/90"
              >
                Sačuvaj pristup
              </button>
            </div>
          </div>
        </form>
      )}

      {canViewUsage && (
        <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
          <h3 className="text-sm font-semibold text-foreground">
            Aktivnost u poslednjih 30 dana
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <UsageStat label="Portal posete" value={usageTotals.portalVisits} />
            <UsageStat label="Porudžbine" value={usageTotals.ordersCreated} />
            <UsageStat
              label="AI obrade"
              value={usageTotals.aiGenerationsStarted}
            />
            <UsageStat
              label="Potrošeni krediti"
              value={formatCreditsFromUnits(usageTotals.aiCreditsSpentUnits)}
            />
            <UsageStat
              label="Dodeljeni krediti"
              value={formatCreditsFromUnits(usageTotals.aiCreditsGrantedUnits)}
            />
          </div>
          {user.usageDaily.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b border-border/40">
                    <th className="py-2 pr-3">Dan</th>
                    <th className="py-2 pr-3">Posete</th>
                    <th className="py-2 pr-3">Porudžbine</th>
                    <th className="py-2 pr-3">AI obrade</th>
                    <th className="py-2 pr-3">Krediti</th>
                    <th className="py-2 pr-3">Poslednje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {user.usageDaily.map((day) => (
                    <tr key={day.id}>
                      <td className="py-2 pr-3 text-foreground">
                        {day.day.toLocaleDateString("sr-Latn-RS")}
                      </td>
                      <td className="py-2 pr-3">{day.portalVisits}</td>
                      <td className="py-2 pr-3">{day.ordersCreated}</td>
                      <td className="py-2 pr-3">
                        {day.aiGenerationsStarted}
                      </td>
                      <td className="py-2 pr-3">
                        -{formatCreditsFromUnits(day.aiCreditsSpentUnits)}
                        {day.aiCreditsGrantedUnits > 0 &&
                          ` / +${formatCreditsFromUnits(
                            day.aiCreditsGrantedUnits,
                          )}`}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {day.lastActiveAt
                          ? day.lastActiveAt.toLocaleTimeString("sr-Latn-RS", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
          <h3 className="text-sm font-semibold text-foreground">
            Istorija AI kredita ({user.aiCreditTransactions.length})
          </h3>
          {user.aiCreditTransactions.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">Nema transakcija.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {user.aiCreditTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-lg border border-border/20 bg-background/60 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {TX_TYPE_LABEL[tx.type] ?? tx.type}
                      </p>
                      {tx.note && (
                        <p className="text-[0.68rem] text-muted-foreground line-clamp-2">
                          {tx.note}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xs font-semibold ${
                          tx.units > 0
                            ? "text-[color:var(--color-sage-deep)]"
                            : "text-muted-foreground"
                        }`}
                      >
                        {tx.units > 0 ? "+" : ""}
                        {formatCreditsFromUnits(Math.abs(tx.units))}
                      </p>
                      {tx.amountCents != null && canViewFinance && (
                        <p className="text-[0.62rem] text-muted-foreground">
                          {formatCents(tx.amountCents)}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-[0.62rem] text-muted-foreground/80">
                    {tx.createdAt.toLocaleDateString("sr-Latn-RS", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · balans posle: "}
                    {formatCreditsFromUnits(tx.balanceAfterUnits)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
          <h3 className="text-sm font-semibold text-foreground">
            Porudžbine ({user.orders.length})
          </h3>
          {user.orders.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">Nema porudžbina.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {user.orders.map((order) => {
                const body = (
                  <>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {order.projectName ?? order.orderNumber}
                    </p>
                    <p className="text-[0.68rem] text-muted-foreground">
                      {order.orderNumber} ·{" "}
                      {order.createdAt.toLocaleDateString("sr-Latn-RS")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusAccent(order.status)}>
                      {statusLabel(order.status)}
                    </Badge>
                    {canViewFinance && (
                      <span className="text-xs font-semibold text-foreground">
                        {formatEur(order.totalEur)}
                      </span>
                    )}
                  </div>
                  </>
                );
                return canViewProjects ? (
                  <Link
                    key={order.id}
                    href={`/portal/admin/porudzbine/${order.id}`}
                    className="flex items-center justify-between rounded-lg border border-border/20 bg-background/60 px-3 py-2 transition-colors hover:border-border"
                  >
                    {body}
                  </Link>
                ) : (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border border-border/20 bg-background/60 px-3 py-2"
                  >
                    {body}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsageStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-background/60 p-3">
      <p className="text-[0.68rem] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
        {value}
      </p>
    </div>
  );
}
