import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SectionKicker } from "@/components/brand/section-kicker";
import { Badge } from "@/components/ui/badge";
import { formatEur } from "@/lib/catalog/calculate";

export const metadata: Metadata = {
  title: "Porudžbine",
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Nacrt",
  awaiting_payment: "Čeka plaćanje",
  paid: "Plaćeno",
  in_progress: "U izradi",
  in_review: "Na pregledu",
  revision_requested: "Revizija",
  delivered: "Isporučeno",
  closed: "Zatvoreno",
  cancelled: "Otkazano",
  refunded: "Refundirano",
};

export default async function PorudzbinePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true, files: true } } },
  });

  return (
    <div className="mx-auto w-full max-w-[min(96vw,1720px)] px-6 py-20 md:py-28">
      <SectionKicker>Portal</SectionKicker>
      <h1 className="mt-4 text-3xl text-foreground md:text-4xl">
        Vaše porudžbine
      </h1>

      {orders.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-border/60 bg-card/80 p-8 text-center">
          <p className="text-muted-foreground">
            Još nemate porudžbina. Posetite{" "}
            <Link href="/cene" className="font-medium text-accent hover:underline">
              cenovnik
            </Link>{" "}
            da napravite prvu.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/portal/porudzbine/${order.id}`}
              className="block rounded-2xl border border-border/60 bg-card/80 p-5 transition-shadow hover:shadow-[0_14px_40px_rgba(28,26,25,0.05)]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {order.orderNumber}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.createdAt.toLocaleDateString("sr-Latn-RS", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {" · "}
                    {order._count.items} stavk{order._count.items === 1 ? "a" : "i"}
                    {order._count.files > 0 && ` · ${order._count.files} fajl${order._count.files === 1 ? "" : "ova"}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                  <p className="text-lg font-semibold text-foreground">
                    {formatEur(order.totalEur)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
