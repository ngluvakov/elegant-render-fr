import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatEur } from "@/lib/catalog/calculate";

export const metadata: Metadata = {
  title: "Detalji porudžbine",
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

type Params = Promise<{ orderId: string }>;

export default async function OrderDetailPage({
  params,
}: {
  params: Params;
}) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user?.id) return notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      files: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order || order.userId !== session.user.id) return notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20 md:py-28">
      <Link
        href="/portal/porudzbine"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Sve porudžbine
      </Link>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.createdAt.toLocaleDateString("sr-Latn-RS", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {STATUS_LABELS[order.status] ?? order.status}
          </Badge>
          <p className="text-2xl font-bold text-foreground">
            {formatEur(order.totalEur)}
          </p>
        </div>
      </div>

      {/* Items */}
      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Stavke ({order.items.length})
        </h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border/40 bg-background/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.productLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.categoryLabel}
                  </p>
                </div>
                <p className="flex-shrink-0 font-semibold text-foreground">
                  {formatEur(item.totalEur)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Files */}
      {order.files.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Fajlovi ({order.files.length})
          </h2>
          <div className="mt-4 space-y-2">
            {order.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/60 px-4 py-2.5"
              >
                <p className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {file.fileName}
                </p>
                <span className="text-xs text-muted-foreground">
                  {(file.fileSize / (1024 * 1024)).toFixed(1)} MB
                </span>
                <Badge variant="outline" className="text-[0.6rem]">
                  {file.kind}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Customer note */}
      {order.customerNote && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Napomena
          </h2>
          <p className="mt-2 text-sm text-foreground/80">{order.customerNote}</p>
        </section>
      )}

      {/* Status timeline */}
      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Istorija statusa
        </h2>
        <div className="mt-4 space-y-3">
          {order.statusEvents.map((event) => (
            <div key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                <div className="w-px flex-1 bg-border/40" />
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-foreground">
                  {STATUS_LABELS[event.toStatus] ?? event.toStatus}
                </p>
                {event.note && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {event.note}
                  </p>
                )}
                <p className="mt-0.5 text-[0.65rem] text-muted-foreground/60">
                  {event.createdAt.toLocaleDateString("sr-Latn-RS", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
