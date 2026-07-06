/**
 * /checkout/failure — PayPal payment failure / decline landing.
 *
 * Mirror of /checkout/success for declined or failed PayPal payments
 * (webhook DENIED, reconciler-expired orders). Looked up by ?orderId=.
 * An order that actually completed redirects to the success page so a
 * stale link never scares a paying customer.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { formatChargeAmount } from "@/lib/currency/convert";
import { isChargeCurrency } from "@/lib/currency/config";
import { formatBillingMoney } from "@/lib/billing";
import { PayPalReceipt } from "@/components/marketing/paypal-receipt";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function CheckoutFailurePage({ searchParams }: PageProps) {
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

  if (order.paymentStatus === "completed") {
    redirect(`/checkout/success?orderId=${order.id}`);
  }

  const amountLabel =
    order.chargedAmountMinor != null && isChargeCurrency(order.chargedCurrency)
      ? formatChargeAmount(order.chargedAmountMinor, order.chargedCurrency)
      : formatBillingMoney(
          order.billingTotalCents ?? order.totalCents ?? order.totalEur * 100,
        );

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
          Payment not completed
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          The payment did not go through — you have not been charged.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your order is saved and you can try again from your portal. If
          PayPal declined the payment repeatedly, check your PayPal account
          or try a different funding source.
        </p>
      </div>

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
          Try again from your portal
        </Link>
        <Link
          href="/checkout"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Back to checkout
        </Link>
      </div>
    </main>
  );
}
