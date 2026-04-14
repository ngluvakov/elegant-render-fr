import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrderDetailHero } from "@/components/portal/order-detail-hero";
import { StatusTracker } from "@/components/portal/status-tracker";
import { CommentThread } from "@/components/portal/comment-thread";
import { MessageComposer } from "@/components/portal/message-composer";
import { RevisionUploadCard } from "@/components/portal/revision-upload-card";
import { DeliverablesCard } from "@/components/portal/deliverables-card";
import { OrderSummaryCard } from "@/components/portal/order-summary-card";
import { ReworkRequestCard } from "@/components/portal/rework-request-card";
import { PendingPaymentCard } from "@/components/portal/pending-payment-card";

export const metadata: Metadata = {
  title: "Detalji porudžbine",
  robots: { index: false, follow: false },
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
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, email: true } } },
      },
    },
  });

  if (!order || order.userId !== session.user.id) return notFound();

  const firstItem = order.items[0];
  const sourceFiles = order.files.filter((f) => f.kind === "source" || f.kind === "revision");
  const deliverableFiles = order.files.filter((f) => f.kind === "deliverable");

  return (
    <div className="space-y-6">
      {/* Hero */}
      <OrderDetailHero
        orderNumber={order.orderNumber}
        status={order.status}
        totalEur={order.totalEur}
        createdAt={order.createdAt}
        updatedAt={order.updatedAt}
        firstItemLabel={firstItem?.productLabel}
        firstItemCategory={firstItem?.categoryLabel}
      />

      {/* Status tracker */}
      <StatusTracker currentStatus={order.status} />

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: main column — communication */}
        <div className="space-y-6">
          <CommentThread
            orderId={order.id}
            initialComments={order.comments}
            currentUserId={session.user.id}
          />
          <MessageComposer orderId={order.id} />
          <RevisionUploadCard orderId={order.id} />
        </div>

        {/* Right: utility panel */}
        <div className="space-y-6">
          {(order.status === "draft" || order.status === "awaiting_payment") && (
            <PendingPaymentCard orderId={order.id} totalEur={order.totalEur} />
          )}
          <DeliverablesCard files={deliverableFiles} orderId={order.id} />
          <OrderSummaryCard
            items={order.items}
            customerNote={order.customerNote}
            sourceFiles={sourceFiles}
          />
          {order.status === "in_review" && (
            <ReworkRequestCard orderId={order.id} />
          )}
        </div>
      </div>
    </div>
  );
}
