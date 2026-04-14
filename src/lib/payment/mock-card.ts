/**
 * mock-card.ts — Mock card payment provider for development/testing.
 *
 * Exports processMockCardPayment() which simulates a 1-second card
 * processing delay and always returns success. Placeholder for Banca Intesa.
 *
 * Used by: server/actions/payment
 */

// Mock card payment provider (simulates Banca Intesa for development)

export async function processMockCardPayment(
  amountEur: number,
): Promise<{ success: boolean; paymentId: string }> {
  // Simulate processing delay
  await new Promise((r) => setTimeout(r, 1000));

  return {
    success: true,
    paymentId: `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  };
}
