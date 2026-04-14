/**
 * payment.ts — PayPal and mock card payment server actions.
 *
 * Exports createPayPalOrderAction, capturePayPalOrderAction, and
 * mockCardPaymentAction. Each transitions order status and sends
 * confirmation email on successful capture.
 *
 * Used by: poruci/steps/step-payment, paypal-buttons,
 *          portal/pending-payment-card, paypal-portal-buttons
 */
"use server";

import { prisma } from "@/lib/db";
import { transitionOrder } from "@/lib/order/status-machine";
import {
  createPayPalOrder as createPPOrder,
  capturePayPalOrder as capturePPOrder,
} from "@/lib/payment/paypal";
import { processMockCardPayment } from "@/lib/payment/mock-card";
import { sendOrderConfirmationEmail } from "@/lib/email";

export type PaymentResult = {
  error?: string;
  success?: boolean;
  paypalOrderId?: string;
};

// ─── PayPal ──────────────────────────────────────────────

export async function createPayPalOrderAction(
  orderId: string,
): Promise<PaymentResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Porudžbina nije pronađena." };
  if (order.status !== "draft" && order.status !== "awaiting_payment") {
    return { error: "Porudžbina nije u ispravnom statusu za plaćanje." };
  }

  try {
    const paypalOrderId = await createPPOrder(order.totalEur);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentProvider: "paypal",
        paymentId: paypalOrderId,
      },
    });

    if (order.status === "draft") {
      await transitionOrder(orderId, "awaiting_payment", undefined, "PayPal plaćanje započeto");
    }

    return { paypalOrderId };
  } catch (err) {
    return { error: `PayPal greška: ${err instanceof Error ? err.message : "Nepoznata greška"}` };
  }
}

export async function capturePayPalOrderAction(
  orderId: string,
  paypalOrderId: string,
): Promise<PaymentResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Porudžbina nije pronađena." };

  try {
    const { capturedAmount, status } = await capturePPOrder(paypalOrderId);

    if (status !== "COMPLETED") {
      return { error: "PayPal plaćanje nije uspelo." };
    }

    if (capturedAmount !== order.totalEur) {
      return { error: "Iznos plaćanja se ne poklapa." };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "completed" },
    });

    await transitionOrder(orderId, "paid", undefined, "PayPal plaćanje potvrđeno");

    // Send confirmation email
    const user = await prisma.user.findUnique({ where: { id: order.userId } });
    if (user?.email) {
      try {
        await sendOrderConfirmationEmail(
          user.email,
          order.orderNumber,
          order.totalEur,
        );
      } catch {
        // Don't fail payment if email fails
      }
    }

    return { success: true };
  } catch (err) {
    return { error: `Greška pri potvrdi: ${err instanceof Error ? err.message : "Nepoznata greška"}` };
  }
}

// ─── Mock Card ───────────────────────────────────────────

export async function mockCardPaymentAction(
  orderId: string,
): Promise<PaymentResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Porudžbina nije pronađena." };
  if (order.status !== "draft" && order.status !== "awaiting_payment") {
    return { error: "Porudžbina nije u ispravnom statusu za plaćanje." };
  }

  try {
    const { paymentId } = await processMockCardPayment(order.totalEur);

    if (order.status === "draft") {
      await transitionOrder(orderId, "awaiting_payment");
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentProvider: "card_mock",
        paymentId,
        paymentStatus: "completed",
      },
    });

    await transitionOrder(orderId, "paid", undefined, "Kartično plaćanje potvrđeno (test)");

    const user = await prisma.user.findUnique({ where: { id: order.userId } });
    if (user?.email) {
      try {
        await sendOrderConfirmationEmail(
          user.email,
          order.orderNumber,
          order.totalEur,
        );
      } catch {
        // Don't fail payment if email fails
      }
    }

    return { success: true };
  } catch (err) {
    return { error: `Greška: ${err instanceof Error ? err.message : "Nepoznata greška"}` };
  }
}
