/**
 * PayPalReceipt — compact PayPal transaction summary block.
 *
 * Replaces the bank-mandated receipt of the old card gateway: order
 * number, capture id,
 * charged amount in the presentment currency, payer email and the
 * capture status. Server-renderable (no client hooks).
 *
 * Used on: checkout /success and /failure pages.
 */

type PayPalReceiptProps = {
  orderNumber: string;
  captureId: string | null;
  captureStatus: string | null;
  /** Pre-formatted charged amount (e.g. "$199"). */
  amountLabel: string | null;
  payerEmail: string | null;
};

export function PayPalReceipt({
  orderNumber,
  captureId,
  captureStatus,
  amountLabel,
  payerEmail,
}: PayPalReceiptProps) {
  const rows: Array<[string, string]> = [
    ["Order number", orderNumber],
    ...(amountLabel ? ([["Amount charged", amountLabel]] as Array<[string, string]>) : []),
    ...(captureId ? ([["PayPal transaction id", captureId]] as Array<[string, string]>) : []),
    ...(captureStatus ? ([["Status", captureStatus]] as Array<[string, string]>) : []),
    ...(payerEmail ? ([["PayPal account", payerEmail]] as Array<[string, string]>) : []),
  ];

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
      <h2 className="text-sm font-semibold text-foreground">
        Payment details
      </h2>
      <dl className="mt-4 space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-mono text-[0.82rem] text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
