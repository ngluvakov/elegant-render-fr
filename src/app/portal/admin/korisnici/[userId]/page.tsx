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
    },
  });

  if (!user) return notFound();

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
            {user.isAdmin && (
              <Badge className="gap-1 bg-accent/10 text-accent">
                <ShieldCheck className="h-3 w-3" />
                Admin
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
          </p>
        </div>
      </div>

      <AdminGrantCreditsPanel
        userId={user.id}
        userName={user.name}
        userEmail={user.email}
        balanceUnits={user.aiCreditBalanceUnits}
        expiresAt={user.aiCreditsExpireAt}
      />

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
                      {tx.amountCents != null && (
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
              {user.orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/portal/admin/porudzbine/${order.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/20 bg-background/60 px-3 py-2 transition-colors hover:border-border"
                >
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
                    <span className="text-xs font-semibold text-foreground">
                      {formatEur(order.totalEur)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
