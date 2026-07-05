/**
 * NestpayReceipt — shared server-component receipt for /checkout/success
 * and /checkout/failure.
 *
 * Renders either 5 sections (success) or 4 sections (failure, no
 * Stavke porudžbine) from a typed NestpayReceiptData prop built by
 * getNestpayReceiptData().
 *
 * Section order:
 *   success:  Porudžbina → Stavke → Kupac → Trgovac → Transakcija
 *   failure:  Porudžbina → Kupac → Trgovac → Transakcija
 *
 * Transaction field labels per EPM §2.7 — see HTML comment on the
 * wrapping section element.
 */

import { type NestpayReceiptData } from "@/lib/nestpay/receipt-data";
import { IMPRINT, formatAddress } from "@/lib/content/site";

type Props = {
  data: NestpayReceiptData;
  variant: "success" | "failure";
};

function row(label: string, value: string | null | undefined) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <dt className="min-w-[220px] text-sm text-muted-foreground">{label}</dt>
      <dd className="break-all text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

function monoRow(label: string, value: string | null | undefined) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <dt className="min-w-[220px] text-sm text-muted-foreground">{label}</dt>
      <dd className="break-all font-mono text-sm text-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}

const CARD = "rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8";

export function NestpayReceipt({ data, variant }: Props) {
  const { orderNumber, customer, lineItems, totals, transaction } = data;

  const trxDateLabel = transaction.trxDate
    ? transaction.trxDate.toLocaleString("sr-Latn-RS", { hour12: false })
    : null;

  return (
    <div className="space-y-6">
      {/* ── Podaci o porudžbini ───────────────────────────────── */}
      <section className={CARD}>
        <h2 className="text-lg font-semibold text-foreground">
          Podaci o porudžbini
        </h2>
        <dl className="mt-4 space-y-2">
          {row("Broj porudžbine", orderNumber)}
          {row("Ukupno za naplatu", totals.totalLabel)}
          {totals.installmentCount
            ? row("Broj rata", String(totals.installmentCount))
            : null}
          {totals.vatBreakdownLabel
            ? row("PDV (20%)", totals.vatBreakdownLabel)
            : null}
        </dl>
      </section>

      {/* ── Stavke porudžbine (success only) ─────────────────── */}
      {variant === "success" && lineItems.length > 0 && (
        <section className={CARD}>
          <h2 className="text-lg font-semibold text-foreground">
            Stavke porudžbine
          </h2>
          <div className="-mx-2 mt-4 overflow-x-auto sm:mx-0">
            <table className="min-w-full text-sm">
              <thead className="text-left text-[0.78rem] uppercase tracking-[0.16em] text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="px-2 py-2">Usluga</th>
                  <th className="px-2 py-2 text-right">Kol.</th>
                  <th className="px-2 py-2 text-right">Jed. cena</th>
                  <th className="px-2 py-2 text-right">Ukupno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground/80">
                {lineItems.map((item, i) => (
                  <tr key={i}>
                    <td className="px-2 py-2 align-top">{item.label}</td>
                    <td className="px-2 py-2 text-right tabular-nums align-top">
                      {item.quantity}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums align-top">
                      {item.unitPriceLabel}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums align-top font-medium text-foreground">
                      {item.totalLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Podaci o kupcu ────────────────────────────────────── */}
      <section className={CARD}>
        <h2 className="text-lg font-semibold text-foreground">
          Podaci o kupcu
        </h2>
        <dl className="mt-4 space-y-2">
          {row("Ime", customer.name)}
          {row("E-pošta", customer.email)}
          {row("Adresa", customer.address)}
        </dl>
      </section>

      {/* ── Podaci o trgovcu ─────────────────────────────────── */}
      <section className={CARD}>
        <h2 className="text-lg font-semibold text-foreground">
          Podaci o trgovcu
        </h2>
        <p className="mt-3 text-sm text-foreground">
          <strong>{IMPRINT.shortName}</strong>
          <br />
          {IMPRINT.legalName}
          <br />
          PIB {IMPRINT.taxId} · MB {IMPRINT.registryNumber}
          <br />
          {formatAddress()}
          <br />
          {IMPRINT.email}
        </p>
      </section>

      {/* Banca Intesa EPM v3.4 §2.7 */}
      <section className={CARD}>
        <h2 className="text-lg font-semibold text-foreground">
          Podaci o transakciji
        </h2>
        <dl className="mt-4 space-y-2">
          {monoRow("Broj narudžbine (order ID)", transaction.oid)}
          {monoRow("Autorizacioni kod (AuthCode)", transaction.authCode)}
          {monoRow(
            "Identifikator transakcije (TransId)",
            transaction.transId,
          )}
          {monoRow("Status transakcije (Response)", transaction.response)}
          {monoRow(
            "Kod statusa (ProcReturnCode)",
            transaction.procReturnCode,
          )}
          {monoRow(
            "Statusni kod 3D transakcije (mdStatus)",
            transaction.mdStatus,
          )}
          {monoRow("Datum transakcije (EXTRA.TRXDATE)", trxDateLabel)}
          {monoRow("Host ref. broj (HostRefNum)", transaction.hostRefNum)}
        </dl>
      </section>
    </div>
  );
}
