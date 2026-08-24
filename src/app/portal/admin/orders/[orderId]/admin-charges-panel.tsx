"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CONFIGURATOR_CATEGORIES } from "@/lib/catalog/configurator";
import { formatEur } from "@/lib/catalog/calculate";
import {
  adminCancelCharge,
  adminCreateCharge,
} from "@/server/actions/admin-charges";
import {
  AdminPlutosSyncPanel,
  type PlutosSyncAction,
  type PlutosSyncSnapshot,
} from "./admin-plutos-sync-panel";

type ChargeItemView = {
  id: string;
  productId: string | null;
  kind: string;
  label: string;
  amountCents: number;
  quantity: number;
};

type ChargeView = {
  id: string;
  reason: string | null;
  totalCents: number;
  status: "pending" | "paid" | "cancelled";
  paymentProvider: string | null;
  paidAt: Date | null;
  invoiceNumber: string | null;
  invoiceIssuedAt: Date | null;
  createdAt: Date;
  items: ChargeItemView[];
  plutosSync?: PlutosSyncSnapshot;
};

type CatalogOption = {
  productId: string;
  label: string;
  categoryLabel: string;
  basePriceEur: number;
};

const CATALOG_OPTIONS: CatalogOption[] = CONFIGURATOR_CATEGORIES.flatMap((cat) =>
  cat.products.map((p) => ({
    productId: p.id,
    label: p.label,
    categoryLabel: cat.label,
    basePriceEur: p.basePriceEur,
  })),
);

type RowState = {
  rid: string;
  source: "catalog" | "custom";
  productId: string | null;
  label: string;
  amountEur: string; // input as string for editability
  quantity: string;
};

function blankRow(): RowState {
  return {
    rid: Math.random().toString(36).slice(2, 9),
    source: "custom",
    productId: null,
    label: "",
    amountEur: "",
    quantity: "1",
  };
}

function statusLabel(status: ChargeView["status"]): string {
  if (status === "pending") return "En attente de paiement";
  if (status === "paid") return "Payé";
  return "Annulé";
}

function statusAccent(status: ChargeView["status"]): string {
  if (status === "pending") return "bg-accent/15 text-accent";
  if (status === "paid") return "bg-accent/15 text-foreground";
  return "bg-muted text-muted-foreground";
}

export function AdminChargesPanel({
  orderId,
  charges,
  plutosRequestAction,
  plutosRefreshAction,
}: {
  orderId: string;
  charges: ChargeView[];
  plutosRequestAction?: PlutosSyncAction;
  plutosRefreshAction?: PlutosSyncAction;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RowState[]>([blankRow()]);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const totalCents = useMemo(() => {
    return rows.reduce((sum, row) => {
      const rsd = Number(row.amountEur);
      const qty = Math.max(1, Math.floor(Number(row.quantity) || 0));
      if (!Number.isFinite(rsd) || rsd <= 0) return sum;
      return sum + Math.round(rsd * 100) * qty;
    }, 0);
  }, [rows]);

  const updateRow = (rid: string, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r) => (r.rid === rid ? { ...r, ...patch } : r)));
  };

  const removeRow = (rid: string) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.rid !== rid)));
  };

  const addRow = () => setRows((prev) => [...prev, blankRow()]);

  const pickCatalog = (rid: string, productId: string) => {
    const opt = CATALOG_OPTIONS.find((o) => o.productId === productId);
    if (!opt) return;
    updateRow(rid, {
      source: "catalog",
      productId: opt.productId,
      label: `${opt.categoryLabel} — ${opt.label}`,
      amountEur: opt.basePriceEur.toString(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const items = rows.map((row) => {
      const rsd = Number(row.amountEur);
      const qty = Math.max(1, Math.floor(Number(row.quantity) || 1));
      return {
        productId: row.productId ?? undefined,
        kind:
          row.source === "catalog"
            ? "service_addition"
            : "custom",
        label: row.label.trim(),
        amountCents: Math.round(rsd * 100),
        quantity: qty,
      };
    });

    for (const item of items) {
      if (!item.label) {
        setError("Chaque article doit avoir une désignation.");
        return;
      }
      if (!Number.isFinite(item.amountCents) || item.amountCents <= 0) {
        setError(`Le prix de « ${item.label} » doit être supérieur à zéro.`);
        return;
      }
    }

    setPending(true);
    const result = await adminCreateCharge({
      orderId,
      reason: reason.trim() || undefined,
      items,
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setRows([blankRow()]);
    setReason("");
    router.refresh();
  };

  const handleCancel = async (chargeId: string) => {
    setCancellingId(chargeId);
    const result = await adminCancelCharge({ chargeId });
    setCancellingId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="rounded-lg border border-border/40 bg-card/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Receipt className="h-3.5 w-3.5 text-accent" />
            Frais supplémentaires
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Prestations supplémentaires, modifications ou travaux sur mesure hors du périmètre initial.
          </p>
        </div>
        {!open && (
          <Button size="sm" onClick={() => setOpen(true)}>
            Demander un supplément
          </Button>
        )}
      </div>

      {charges.length > 0 && (
        <div className="mt-4 space-y-3">
          {charges.map((charge) => (
            <div
              key={charge.id}
              className="rounded-xl border border-border/40 bg-background/60 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge className={statusAccent(charge.status)}>
                      {statusLabel(charge.status)}
                    </Badge>
                    <span className="text-[0.68rem] text-muted-foreground">
                      {charge.createdAt.toLocaleDateString("fr-FR")}
                    </span>
                    {charge.paymentProvider && (
                      <span className="text-[0.68rem] text-muted-foreground">
                        · {charge.paymentProvider}
                      </span>
                    )}
                  </div>
                  {charge.reason && (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                      {charge.reason}
                    </p>
                  )}
                </div>
                <p className="font-semibold text-foreground">
                  {formatEur(charge.totalCents / 100)}
                </p>
              </div>
              <ul className="mt-2 space-y-0.5 text-[0.72rem] text-foreground/80">
                {charge.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span className="truncate">
                      {item.label}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                    </span>
                    <span className="font-medium">
                      {formatEur((item.amountCents * item.quantity) / 100)}
                    </span>
                  </li>
                ))}
              </ul>
              {charge.invoiceNumber && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 text-[0.72rem]">
                  <div>
                    <span className="text-muted-foreground">Facture </span>
                    <span className="font-mono text-foreground">
                      {charge.invoiceNumber}
                    </span>
                    {charge.invoiceIssuedAt && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {charge.invoiceIssuedAt.toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                  <a
                    href={`/api/portal/charge-invoice/${charge.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Télécharger la facture
                  </a>
                </div>
              )}
              {charge.invoiceNumber && charge.plutosSync && (
                <AdminPlutosSyncPanel
                  target="charge"
                  targetId={charge.id}
                  sync={charge.plutosSync}
                  requestAction={plutosRequestAction}
                  refreshAction={plutosRefreshAction}
                  compact
                />
              )}
              {charge.status === "pending" && (
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => handleCancel(charge.id)}
                    disabled={cancellingId === charge.id}
                  >
                    {cancellingId === charge.id ? "Annulation…" : "Annuler"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div
                key={row.rid}
                className="rounded-xl border border-border/40 bg-background/60 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    Article {index + 1}
                  </p>
                  {rows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeRow(row.rid)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="mt-2 grid gap-2">
                  <div>
                    <Label className="text-[0.68rem]">Depuis le catalogue (facultatif)</Label>
                    <select
                      value={row.productId ?? ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          pickCatalog(row.rid, e.target.value);
                        } else {
                          updateRow(row.rid, {
                            source: "custom",
                            productId: null,
                          });
                        }
                      }}
                      className="mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2 text-xs"
                    >
                      <option value="">— Sur mesure —</option>
                      {CATALOG_OPTIONS.map((opt) => (
                        <option key={opt.productId} value={opt.productId}>
                          {opt.categoryLabel} — {opt.label} (à partir de {formatEur(opt.basePriceEur)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-[0.68rem]">Désignation</Label>
                    <Input
                      value={row.label}
                      onChange={(e) =>
                        updateRow(row.rid, { label: e.target.value })
                      }
                      placeholder="Ex. : pièce supplémentaire — cuisine"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[0.68rem]">Prix unitaire (EUR)</Label>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={row.amountEur}
                        onChange={(e) =>
                          updateRow(row.rid, { amountEur: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[0.68rem]">Quantité</Label>
                      <Input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) =>
                          updateRow(row.rid, { quantity: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-3 w-3" />
            Ajouter un article
          </Button>

          <div>
            <Label className="text-xs">Motif (le client le verra dans l’e-mail)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex. : modifications supplémentaires convenues après la présentation."
              rows={2}
              className="mt-1 resize-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
            <span className="text-xs text-muted-foreground">Total à facturer</span>
            <span className="text-base font-bold text-foreground">
              {formatEur(totalCents / 100)}
            </span>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending || totalCents <= 0}>
              {pending ? "Envoi en cours…" : "Envoyer au client pour paiement"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                setError("");
              }}
              disabled={pending}
            >
              Annuler
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
