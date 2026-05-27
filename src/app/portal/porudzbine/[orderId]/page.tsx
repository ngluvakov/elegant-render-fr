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
import { ProformaCard } from "@/components/portal/proforma-card";
import { ItemConfigPanel } from "@/components/portal/item-config-panel";
import { AddServiceDialog } from "@/components/portal/add-service-dialog";
import { ReferenceOrderPicker } from "@/components/portal/reference-order-picker";
import { OrderChargesCard } from "@/components/portal/order-charges-card";
import { OrderInvoicesCard } from "@/components/portal/order-invoices-card";
import { OrderAssistantGuideContext } from "@/components/chat/order-guide-context";
import { OrderCurrencyProvider } from "@/components/portal/order-currency-context";
import { AlertCircle } from "lucide-react";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";
import { displayCurrencyForBillingCurrency } from "@/lib/billing";
import { getDisplayCurrencyForCountry } from "@/lib/catalog/display-currency";

export const metadata: Metadata = {
  title: "Detalji porudžbine",
  description:
    "Detalji izabrane porudžbine, status projekta, stavke, poruke i isporuke.",
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
      items: {
        include: {
          files: {
            select: {
              id: true,
              fileName: true,
              fileSize: true,
              kind: true,
              floorId: true,
            },
          },
        },
      },
      files: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, email: true } } },
      },
      charges: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
    },
  });

  if (!order || order.userId !== session.user.id) return notFound();
  const pricingCatalog = await getPublishedPricingCatalog();

  // Display currency: prefer the snapshot stamped on the order (set by
  // createOrder / createEmptyDraft); fall back to the user's profile
  // billingCountryCode for legacy orders that pre-date the snapshot.
  const userBilling = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { billingCountryCode: true },
  });
  const displayCurrency = order.billingCurrency
    ? displayCurrencyForBillingCurrency(order.billingCurrency)
    : getDisplayCurrencyForCountry(userBilling?.billingCountryCode);

  // Rule 3 picker — list user's paid-or-later orders as referencable.
  const referencableOrders = await prisma.order.findMany({
    where: {
      userId: session.user.id,
      id: { not: orderId },
      status: {
        in: ["paid", "in_progress", "in_review", "revision_requested", "delivered", "closed"],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      orderNumber: true,
      projectName: true,
      status: true,
    },
  });

  const firstItem = order.items[0];
  const serviceItems = order.items.filter((item) => item.kind === "service");
  const sourceFiles = order.files.filter((f) => f.kind === "source" || f.kind === "revision");
  const deliverableFiles = order.files.filter((f) => f.kind === "deliverable");
  const savingsEur = order.items.reduce(
    (sum, i) => sum + Math.max(0, (i.originalTotalEur ?? i.totalEur) - i.totalEur),
    0,
  );
  const isDraft = order.status === "draft";
  const canEditItems =
    order.status === "draft" ||
    order.status === "awaiting_payment" ||
    order.status === "paid";
  const projectStarted = !["draft", "awaiting_payment"].includes(order.status);
  const inRevisionLoop =
    order.status === "in_review" || order.status === "revision_requested";

  // Items missing the minimum: no description and no files.
  const unconfiguredCount = serviceItems.filter(
    (item) => !item.clientNote?.trim() && item.files.length === 0,
  ).length;

  return (
    <OrderCurrencyProvider
      currency={displayCurrency}
      settings={pricingCatalog.settings}
    >
    <div className="space-y-6">
      <OrderAssistantGuideContext
        productIds={serviceItems.map((item) => item.productId)}
        unconfiguredCount={unconfiguredCount}
        hasFiles={
          sourceFiles.length > 0 ||
          serviceItems.some((item) => item.files.length > 0)
        }
        canEditItems={canEditItems}
      />

      {/* Hero */}
      <OrderDetailHero
        orderId={order.id}
        orderNumber={order.orderNumber}
        status={order.status}
        totalEur={order.totalEur}
        totalCents={order.totalCents}
        billingCurrency={order.billingCurrency}
        billingTotalCents={order.billingTotalCents}
        savingsEur={savingsEur}
        createdAt={order.createdAt}
        updatedAt={order.updatedAt}
        projectName={order.projectName}
        firstItemLabel={firstItem?.productLabel}
        firstItemCategory={firstItem?.categoryLabel}
        displayCurrency={displayCurrency}
        pricingSettings={pricingCatalog.settings}
      />

      {/* Status tracker */}
      <StatusTracker currentStatus={order.status} />

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: main column */}
        <div className="space-y-6">
          {/* Item configuration — for draft/unpaid orders */}
          {canEditItems && (
            <section>
              <h2 className="mb-4 text-sm font-semibold text-foreground">
                Podešavanje stavki ({serviceItems.length})
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Za svaku stavku dodajte opis, osnove i reference stila. Za detaljnije opcije koristite „Napredno podešavanje”.
              </p>

              {unconfiguredCount > 0 && (
                <div className="mb-4 flex items-start gap-3 rounded-2xl border-l-4 border-l-[color:var(--color-ember-deep)] border border-[color:var(--color-ember)]/50 bg-gradient-to-br from-[color:var(--color-ember)]/[0.12] to-[color:var(--color-ember)]/[0.04] p-4 shadow-[0_8px_24px_-12px_rgba(163,127,45,0.3)] animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="relative mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-ember)]/40" />
                    <AlertCircle className="relative h-6 w-6 text-[color:var(--color-ember-deep)]" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[color:var(--color-ember-deep)]">
                      {unconfiguredCount === 1
                        ? "1 stavka čeka vaše podatke"
                        : `${unconfiguredCount} stavk${unconfiguredCount < 5 ? "e" : "i"} čeka${unconfiguredCount === 1 ? "" : "ju"} vaše podatke`}
                    </p>
                    <p className="mt-1 text-xs text-foreground/70">
                      Dodajte opis ili prebacite fajlove (osnove, fotografije, skice) da bismo mogli da započnemo projekat. Stavke označene sa{" "}
                      <span className="inline-flex translate-y-[1px] items-center gap-1 rounded bg-[color:var(--color-ember)]/20 px-1.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-[color:var(--color-ember-deep)]">
                        Potrebni podaci
                      </span>{" "}
                      su u pitanju.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {serviceItems.map((item) => (
                  <ItemConfigPanel
                    key={item.id}
                    canDelete={isDraft}
                    item={{
                      id: item.id,
                      orderId: order.id,
                      productId: item.productId,
                      productLabel: item.productLabel,
                      categoryLabel: item.categoryLabel,
                      totalEur: item.totalEur,
                      originalTotalEur: item.originalTotalEur,
                      discountPct: item.discountPct,
                      discountReason: item.discountReason,
                      clientNote: item.clientNote,
                      configJson: item.configJson as Record<string, unknown> | null,
                      files: item.files,
                    }}
                  />
                ))}

                {isDraft && (
                  <AddServiceDialog
                    orderId={order.id}
                    existingProductIds={serviceItems.map((i) => i.productId)}
                    categories={pricingCatalog.categories}
                  />
                )}

                {isDraft && (
                  <ReferenceOrderPicker
                    orderId={order.id}
                    initialReferenceId={order.referencedOrderId}
                    availableOrders={referencableOrders}
                  />
                )}
              </div>
            </section>
          )}

          <OrderChargesCard
            charges={order.charges.map((c) => ({
              id: c.id,
              reason: c.reason,
              totalCents: c.totalCents,
              billingCurrency: c.billingCurrency,
              billingVatRate: c.billingVatRate,
              billingEurToRsdRate: c.billingEurToRsdRate,
              billingTotalCents: c.billingTotalCents,
              status: c.status,
              paidAt: c.paidAt,
              createdAt: c.createdAt,
              items: c.items.map((it) => ({
                id: it.id,
                label: it.label,
                amountCents: it.amountCents,
                quantity: it.quantity,
              })),
            }))}
          />

          {projectStarted && (
            <>
              <CommentThread
                orderId={order.id}
                initialComments={order.comments}
                currentUserId={session.user.id}
              />
              <MessageComposer orderId={order.id} />
            </>
          )}
          {inRevisionLoop && <RevisionUploadCard orderId={order.id} />}
        </div>

        {/* Right: utility panel */}
        <div className="space-y-6">
          {order.proformaNumber &&
            order.proformaIssuedAt &&
            order.paymentStatus !== "completed" && (
              <ProformaCard
                orderId={order.id}
                orderNumber={order.orderNumber}
                proformaNumber={order.proformaNumber}
                proformaIssuedAt={order.proformaIssuedAt}
                totalEur={order.totalEur}
                totalCents={order.totalCents}
                billingCurrency={order.billingCurrency}
                billingTotalCents={order.billingTotalCents}
              />
            )}
          {(order.status === "draft" || order.status === "awaiting_payment") &&
            order.paymentMethod !== "wire_transfer" && (
              <PendingPaymentCard
                orderId={order.id}
                totalEur={order.totalEur}
                totalCents={order.totalCents}
                billingCurrency={order.billingCurrency}
                billingTotalCents={order.billingTotalCents}
              />
            )}
          <DeliverablesCard files={deliverableFiles} orderId={order.id} />
          <OrderInvoicesCard order={order} charges={order.charges} />
          <OrderSummaryCard
            items={order.items}
            customerNote={order.customerNote}
            sourceFiles={sourceFiles}
            displayCurrency={displayCurrency}
            pricingSettings={pricingCatalog.settings}
          />
          {order.status === "in_review" && (
            <ReworkRequestCard orderId={order.id} />
          )}
        </div>
      </div>
    </div>
    </OrderCurrencyProvider>
  );
}
