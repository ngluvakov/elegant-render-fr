export type PaymentResult = {
  success: boolean;
  paymentId?: string;
  error?: string;
};

export type CreatePaymentResult = {
  externalOrderId: string;
};
