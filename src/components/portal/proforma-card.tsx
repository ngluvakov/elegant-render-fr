/**
 * ProformaCard — Customer-facing proforma panel for wire-transfer
 * orders. Mirrors the data the proforma email surfaces: number,
 * issue/due dates, bank instructions, payment reference, and a
 * download link to the PDF.
 *
 * Visible only when proforma was issued and payment isn't yet
 * recorded. Once admin marks the wire received, the Invoice panel
 * elsewhere on the page takes over and this one disappears.
 */
import { Building2, Calendar, FileDown, Landmark } from "lucide-react";
import { formatEur } from "@/lib/catalog/calculate";
import {
  formatBillingMoney,
  type BillingCurrency,
} from "@/lib/billing";
import { IMPRINT } from "@/lib/content/site";

type Props = {
  orderId: string;
  orderNumber: string;
  proformaNumber: string;
  proformaIssuedAt: Date;
  totalEur: number;
  totalCents: number | null;
  billingCurrency?: BillingCurrency | null;
  billingTotalCents?: number | null;
};

const PROFORMA_VALIDITY_DAYS = 14;

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function ProformaCard({
  orderId,
  orderNumber,
  proformaNumber,
  proformaIssuedAt,
  totalEur,
  totalCents,
  billingCurrency,
  billingTotalCents,
}: Props) {
  const dueDate = new Date(proformaIssuedAt);
  dueDate.setDate(dueDate.getDate() + PROFORMA_VALIDITY_DAYS);

  const amountFormatted =
    billingCurrency && billingTotalCents != null
      ? formatBillingMoney(billingTotalCents, billingCurrency)
      : formatEur((totalCents ?? totalEur * 100) / 100);

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-6">
      <div className="flex items-center gap-2">
        <Landmark className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">
          Facture proforma
        </h3>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Une facture proforma a été émise pour le paiement par virement
        bancaire. Dès réception du paiement, nous émettrons et enverrons la
        facture définitive.
      </p>

      <dl className="mt-4 space-y-1.5 text-xs leading-relaxed">
        <div className="flex flex-wrap gap-x-2">
          <dt className="w-28 text-muted-foreground">N° de proforma :</dt>
          <dd className="font-mono text-foreground">{proformaNumber}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="w-28 text-muted-foreground">Émise le :</dt>
          <dd className="text-foreground">
            {dateFormatter.format(proformaIssuedAt)}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="w-28 text-muted-foreground">À régler avant :</dt>
          <dd className="text-foreground">{dateFormatter.format(dueDate)}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="w-28 text-muted-foreground">Montant :</dt>
          <dd className="font-semibold text-foreground">{amountFormatted}</dd>
        </div>
      </dl>

      <div className="mt-4 rounded-xl border border-border/40 bg-background/60 p-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <h4 className="text-[0.78rem] font-semibold text-foreground">
            Instructions de paiement
          </h4>
        </div>
        <dl className="mt-3 space-y-1.5 text-[0.72rem] leading-relaxed">
          <div className="flex flex-wrap gap-x-2">
            <dt className="w-24 text-muted-foreground">Bénéficiaire :</dt>
            <dd className="text-foreground">{IMPRINT.shortName}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="w-24 text-muted-foreground">Banque :</dt>
            <dd className="text-foreground">{IMPRINT.bank.name}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="w-24 text-muted-foreground">Compte (EUR) :</dt>
            <dd className="font-mono text-foreground">
              {IMPRINT.bank.accountNumber}
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="w-24 text-muted-foreground">IBAN :</dt>
            <dd className="font-mono text-foreground">{IMPRINT.bank.iban}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="w-24 text-muted-foreground">SWIFT/BIC :</dt>
            <dd className="font-mono text-foreground">{IMPRINT.bank.swift}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="w-24 text-muted-foreground">Référence :</dt>
            <dd className="font-mono text-foreground">{orderNumber}</dd>
          </div>
        </dl>
      </div>

      <a
        href={`/api/portal/proforma/${orderId}`}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
      >
        <FileDown className="h-4 w-4" />
        Télécharger la proforma (PDF)
      </a>

      <p className="mt-3 flex items-start gap-1.5 text-[0.68rem] leading-relaxed text-muted-foreground">
        <Calendar className="mt-0.5 h-3 w-3 flex-shrink-0" />
        <span>
          Une proforma n’est pas un document fiscal. La facture définitive sera
          émise après réception du paiement.
        </span>
      </p>
    </div>
  );
}
