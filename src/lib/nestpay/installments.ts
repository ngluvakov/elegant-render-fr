export const NESTPAY_INSTALLMENT_OPTIONS = [1, 2, 3, 6, 12] as const;

export type NestpayInstallmentCount =
  (typeof NESTPAY_INSTALLMENT_OPTIONS)[number];

export function normalizeNestpayInstallmentCount(
  value: unknown,
): NestpayInstallmentCount {
  const parsed = typeof value === "number" ? value : Number(value);
  return NESTPAY_INSTALLMENT_OPTIONS.includes(
    parsed as NestpayInstallmentCount,
  )
    ? (parsed as NestpayInstallmentCount)
    : 1;
}

export function nestpayTaksitField(
  count: NestpayInstallmentCount,
): string | undefined {
  return count > 1 ? String(count) : undefined;
}
