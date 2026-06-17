/**
 * types.ts — Shared payment type definitions.
 *
 * Exports PaymentResult and CreatePaymentResult types used across
 * payment providers (NestPay, mock card).
 *
 * Used by: payment/mock-card (type reference)
 */
export type PaymentResult = {
  success: boolean;
  paymentId?: string;
  error?: string;
};

export type CreatePaymentResult = {
  externalOrderId: string;
};
