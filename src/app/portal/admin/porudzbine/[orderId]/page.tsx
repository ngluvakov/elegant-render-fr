import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatEur } from "@/lib/catalog/calculate";
import { statusLabel, statusAccent } from "@/components/portal/status-utils";
import { StatusTracker } from "@/components/portal/status-tracker";
import { AdminCommentComposer } from "./admin-comment-composer";
import { AdminStatusChanger } from "./admin-status-changer";
import { AdminDeliverableUpload } from "./admin-deliverable-upload";

export const metadata: Metadata = {
  title: "Admin — Detalji porudžbine",
  robots: { index: false, follow: false },
};

type Params = Promise<{ orderId: string }>;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Params;
}) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: true,
      files: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, email: true } } },
      },
    },
  });

  if (!order) return notFound();

  const sourceFiles = order.files.filter((f) => f.kind === "source" || f.kind === "revision");
  const deliverableFiles = order.files.filter((f) => f.kind === "deliverable");

  return (
    <div className="space-y-6">
      <Link
        href="/portal/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Admin panel
      </Link>

      {/* Hero */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {order.orderNumber}
          </p>
          <h1 className="mt-1 font-heading text-2xl text-foreground md:text-3xl">
            {order.items[0]?.productLabel ?? "Porudžbina"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Klijent: <strong className="text-foreground">{order.user.name}</strong>{" "}
            ({order.user.email})
            {order.user.phone && ` · ${order.user.phone}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusAccent(order.status)}>
            {statusLabel(order.status)}
          </Badge>
          <p className="text-2xl font-bold text-foreground">
            {formatEur(order.totalEur)}
          </p>
        </div>
      </div>

      <StatusTracker currentStatus={order.status} />

      {/* Admin: change status */}
      <AdminStatusChanger orderId={order.id} currentStatus={order.status} />

      {/* Two-column */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: comments */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Konverzacija ({order.comments.length})
          </h2>

          {order.comments.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">
              Nema poruka.
            </p>
          )}

          <div className="scrollbar-warm max-h-[500px] space-y-3 overflow-y-auto">
            {order.comments.map((comment) => (
              <div
                key={comment.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  comment.role === "team"
                    ? "mr-auto bg-[color:var(--color-sage)]/10"
                    : "ml-auto bg-accent/8"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[0.6rem] font-semibold uppercase tracking-wider ${
                    comment.role === "team" ? "text-[color:var(--color-sage-deep)]" : "text-accent"
                  }`}>
                    {comment.role === "team" ? "Tim" : comment.author?.name ?? "Klijent"}
                  </span>
                  <span className="text-[0.55rem] text-muted-foreground/60">
                    {comment.createdAt.toLocaleDateString("sr-Latn-RS", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                  {comment.body}
                </p>
              </div>
            ))}
          </div>

          <AdminCommentComposer orderId={order.id} />
        </div>

        {/* Right: files + items */}
        <div className="space-y-6">
          {/* Deliverables upload */}
          <AdminDeliverableUpload orderId={order.id} />

          {/* Existing deliverables */}
          {deliverableFiles.length > 0 && (
            <div className="rounded-2xl border border-[color:var(--color-sage)]/20 bg-[color:var(--color-sage)]/5 p-5">
              <h3 className="text-sm font-semibold text-foreground">
                Isporučeni fajlovi ({deliverableFiles.length})
              </h3>
              <div className="mt-3 space-y-2">
                {deliverableFiles.map((f) => (
                  <div key={f.id} className="rounded-lg bg-background/80 px-3 py-2 text-xs">
                    <p className="font-medium text-foreground">{f.fileName}</p>
                    <p className="text-muted-foreground">
                      {(f.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source files */}
          {sourceFiles.length > 0 && (
            <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
              <h3 className="text-sm font-semibold text-foreground">
                Klijentovi fajlovi ({sourceFiles.length})
              </h3>
              <div className="mt-3 space-y-2">
                {sourceFiles.map((f) => (
                  <div key={f.id} className="rounded-lg bg-background/60 px-3 py-2 text-xs">
                    <p className="font-medium text-foreground">{f.fileName}</p>
                    <p className="text-muted-foreground">
                      {f.kind} · {(f.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
            <h3 className="text-sm font-semibold text-foreground">
              Stavke ({order.items.length})
            </h3>
            <div className="mt-3 space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <div>
                    <p className="font-medium text-foreground">{item.productLabel}</p>
                    <p className="text-muted-foreground">{item.categoryLabel}</p>
                  </div>
                  <span className="font-semibold text-foreground">{formatEur(item.totalEur)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer note */}
          {order.customerNote && (
            <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
              <h3 className="text-sm font-semibold text-foreground">Napomena klijenta</h3>
              <p className="mt-2 text-xs text-foreground/80">{order.customerNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
