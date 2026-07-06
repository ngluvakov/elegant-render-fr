/**
 * /checkout/success — PayPal payment confirmation landing.
 *
 * Used by flows that finish outside the in-wizard success screen:
 * webhook/reconciler-completed orders (eCheck), portal-initiated
 * payments and emailed links. Looks the order up by ?orderId=.
 *
 * Server-rendered, no auth gate: the internal order id is an
 * unguessable capability, the same trust model as the previous
 * bank-return receipt page.
 *
 * States: completed → receipt + purchase dataLayer event (deduped
 * client-side per transaction id); pending PayPal capture (eCheck) →
 * processing copy without the purchase event; anything else → 404.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { formatChargeAmount } from "@/lib/currency/convert";
import { isChargeCurrency } from "@/lib/currency/config";
import { formatBillingMoney } from "@/lib/billing";
import { PayPalReceipt } from "@/components/marketing/paypal-receipt";
import { DataLayerEvent } from "@/components/analytics/data-layer-event";
import { buildPurchaseDataLayerEvent } from "@/server/analytics/google-conversions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  if (!orderId) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      paymentStatus: true,
      paymentProvider: true,
      paypalCaptureId: true,
      paypalCaptureStatus: true,
      paypalPayerEmail: true,
      chargedCurrency: true,
      chargedAmountMinor: true,
      billingTotalCents: true,
      totalCents: true,
      totalEur: true,
    },
  });
  if (!order || order.paymentProvider !== "paypal") notFound();

  const completed = order.paymentStatus === "completed";
  const processing =
    !completed &&
    order.paymentStatus === "pending" &&
    order.paypalCaptureStatus === "PENDING";
  if (!completed && !processing) notFound();

  const amountLabel =
    order.chargedAmountMinor != null && isChargeCurrency(order.chargedCurrency)
      ? formatChargeAmount(order.chargedAmountMinor, order.chargedCurrency)
      : formatBillingMoney(
          order.billingTotalCents ?? order.totalCents ?? order.totalEur * 100,
        );

  const purchaseEvent = completed
    ? await buildPurchaseDataLayerEvent(order.id, "paypal_webhook")
    : null;

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      {purchaseEvent && <DataLayerEvent event={purchaseEvent} />}
      {completed ? (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Payment received
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Your payment has been received — thank you.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            A confirmation with your invoice is on its way to your email.
            You can follow the order status in your portal.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/60 bg-card/60 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Payment processing
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Your payment is processing.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            PayPal confirms eCheck payments within a few days — we&apos;ll
            email you as soon as it clears. Your order is saved and nothing
            else is needed from you right now.
          </p>
        </div>
      )}

      <PayPalReceipt
        orderNumber={order.orderNumber}
        captureId={order.paypalCaptureId}
        captureStatus={order.paypalCaptureStatus}
        amountLabel={amountLabel}
        payerEmail={order.paypalPayerEmail}
      />

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/portal/orders/${order.id}`}
          className={buttonVariants({ variant: "accent", size: "lg" })}
        >
          Open the order in your portal
        </Link>
        <Link
          href="/portal"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Go to portal
        </Link>
      </div>
    </main>
  );
}
