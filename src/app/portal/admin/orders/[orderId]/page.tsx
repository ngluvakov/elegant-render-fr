import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatEur } from "@/lib/catalog/calculate";
import { statusLabel, statusAccent } from "@/components/portal/status-utils";
import { StatusTracker } from "@/components/portal/status-tracker";
import { AdminCommentComposer } from "./admin-comment-composer";
import { AdminProformaButton } from "./admin-proforma-button";
import { AdminMarkPaidButton } from "./admin-mark-paid-button";
import { AdminRetryInvoiceButton } from "./admin-retry-invoice-button";
import { AdminVerifyVatButton } from "./admin-verify-vat-button";
import { AdminActivityTimeline } from "./admin-activity-timeline";
import { AdminStatusChanger } from "./admin-status-changer";
import { AdminDeliverableUpload } from "./admin-deliverable-upload";
import { AdminGrantCreditsPanel } from "./admin-grant-credits-panel";
import { AdminFreeRevisionPanel } from "./admin-free-revision-panel";
import { AdminChargesPanel } from "./admin-charges-panel";
import { AdminPlutosSyncPanel } from "./admin-plutos-sync-panel";
import { AdminRefundButton } from "./admin-refund-button";
import { adminHas, requirePagePermission } from "@/lib/admin-auth";
import { isChargeCurrency } from "@/lib/currency/config";
import { formatChargeAmount } from "@/lib/currency/convert";
import {
  refreshPlutosStatus,
  requestPlutosSync,
} from "@/server/plutos/actions";
import { loadPlutosSyncSnapshot } from "@/server/plutos/snapshot";

export const metadata: Metadata = {
  title: "Détail de commande — Admin",
  description:
    "Détail administrateur de la commande : articles, statut, paiements et actions opérationnelles.",
  robots: { index: false, follow: false },
};

type Params = Promise<{ orderId: string }>;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Params;
}) {
  const { orderId } = await params;
  const admin = await requirePagePermission("PROJECTS_VIEW");
  const canManageProjects = adminHas(admin, "PROJECTS_MANAGE");
  const canManageCredits = adminHas(admin, "AI_CREDITS_MANAGE");
  const canViewFinance = adminHas(admin, "FINANCE_VIEW");
  const canManageFinance = adminHas(admin, "FINANCE_MANAGE");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          aiCreditBalanceUnits: true,
          aiCreditsExpireAt: true,
        },
      },
      items: true,
      files: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, email: true } } },
      },
      charges: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
      sourceInquiry: {
        select: {
          id: true,
          serviceType: true,
          createdAt: true,
          message: true,
          _count: { select: { files: true } },
        },
      },
    },
  });

  if (!order) return notFound();

  const [orderPlutosSync, chargePlutosSyncEntries] = await Promise.all([
    canViewFinance
      ? loadPlutosSyncSnapshot("order", order.id)
      : Promise.resolve(null),
    canManageFinance
      ? Promise.all(
          order.charges.map(async (charge) => [
            charge.id,
            await loadPlutosSyncSnapshot("charge", charge.id),
          ] as const),
        )
      : Promise.resolve([]),
  ]);
  const chargePlutosSyncById = new Map(chargePlutosSyncEntries);

  const sourceFiles = order.files.filter((f) => f.kind === "source" || f.kind === "revision");
  const deliverableFiles = order.files.filter((f) => f.kind === "deliverable");

  return (
    <div className="space-y-6">
      <Link
        href="/portal/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Admin
      </Link>

      {/* Hero */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {order.orderNumber}
          </p>
          <h1 className="mt-1 font-heading text-2xl text-foreground md:text-3xl">
            {order.projectName ?? order.items[0]?.productLabel ?? "Commande"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Client : <strong className="text-foreground">{order.user.name}</strong>{" "}
            ({order.user.email})
            {order.user.phone && ` · ${order.user.phone}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusAccent(order.status)}>
            {statusLabel(order.status)}
          </Badge>
          {canViewFinance && (
            <p className="text-2xl font-bold text-foreground">
              {formatEur(order.totalEur)}
            </p>
          )}
        </div>
      </div>

      <StatusTracker currentStatus={order.status} />

      {canManageProjects && (
        <AdminStatusChanger orderId={order.id} currentStatus={order.status} />
      )}

      {(canManageCredits || canManageProjects) && (
        <div className="grid gap-4 md:grid-cols-2">
          {canManageCredits && (
            <AdminGrantCreditsPanel
              userId={order.user.id}
              userName={order.user.name}
              userEmail={order.user.email}
              balanceUnits={order.user.aiCreditBalanceUnits}
              expiresAt={order.user.aiCreditsExpireAt}
            />
          )}
          {canManageProjects && (
            <AdminFreeRevisionPanel
              orderId={order.id}
              currentStatus={order.status}
            />
          )}
        </div>
      )}

      {canManageFinance && (
        <AdminChargesPanel
          orderId={order.id}
          charges={order.charges.map((c) => ({
            id: c.id,
            reason: c.reason,
            totalCents: c.totalCents,
            status: c.status,
            paymentProvider: c.paymentProvider,
            paidAt: c.paidAt,
            invoiceNumber: c.invoiceNumber,
            invoiceIssuedAt: c.invoiceIssuedAt,
            createdAt: c.createdAt,
            plutosSync: chargePlutosSyncById.get(c.id),
            items: c.items.map((it) => ({
              id: it.id,
              productId: it.productId,
              kind: it.kind,
              label: it.label,
              amountCents: it.amountCents,
              quantity: it.quantity,
            })),
          }))}
          plutosRequestAction={requestPlutosSync}
          plutosRefreshAction={refreshPlutosStatus}
        />
      )}

      {/* Two-column */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: comments */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Conversation ({order.comments.length})
          </h2>

          {order.comments.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">
              Aucun message.
            </p>
          )}

          <div className="scrollbar-warm max-h-[500px] space-y-3 overflow-y-auto">
            {order.comments.map((comment) => (
              <div
                key={comment.id}
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  comment.role === "team"
                    ? "mr-auto bg-secondary/60"
                    : "ml-auto bg-accent/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[0.72rem] font-semibold uppercase tracking-wider ${
                    comment.role === "team" ? "text-muted-foreground" : "text-foreground"
                  }`}>
                    {comment.role === "team" ? "Équipe" : comment.author?.name ?? "Client"}
                  </span>
                  <span className="text-[0.62rem] text-muted-foreground/60">
                    {comment.createdAt.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                  {comment.body}
                </p>
              </div>
            ))}
          </div>

          {canManageProjects && <AdminCommentComposer orderId={order.id} />}
        </div>

        {/* Right: files + items */}
        <div className="space-y-6">
          {/* Chronological activity timeline (status events + audit
              log filtered to this order) — gives admin a single
              place to see what happened, in what order, and who did
              it, without piecing together status changes + invoice
              + proforma + vat panels separately. */}
          <AdminActivityTimeline orderId={order.id} />

          {/* Deliverables upload */}
          {canManageProjects && <AdminDeliverableUpload orderId={order.id} />}

          {/* Existing deliverables */}
          {deliverableFiles.length > 0 && (
            <div className="rounded-lg border border-border bg-secondary/50 p-5">
              <h3 className="text-sm font-semibold text-foreground">
                Fichiers livrés ({deliverableFiles.length})
              </h3>
              <div className="mt-3 space-y-2">
                {deliverableFiles.map((f) => (
                  <div key={f.id} className="rounded-lg bg-background/80 px-3 py-2 text-xs">
                    <p className="font-medium text-foreground">{f.fileName}</p>
                    <p className="text-muted-foreground">
                      {(f.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source files */}
          {sourceFiles.length > 0 && (
            <div className="rounded-lg border border-border/40 bg-card/60 p-5">
              <h3 className="text-sm font-semibold text-foreground">
                Fichiers du client ({sourceFiles.length})
              </h3>
              <div className="mt-3 space-y-2">
                {sourceFiles.map((f) => (
                  <div key={f.id} className="rounded-lg bg-background/60 px-3 py-2 text-xs">
                    <p className="font-medium text-foreground">{f.fileName}</p>
                    <p className="text-muted-foreground">
                      {f.kind} · {(f.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="rounded-lg border border-border/40 bg-card/60 p-5">
            <h3 className="text-sm font-semibold text-foreground">
              Articles ({order.items.length})
            </h3>
            <div className="mt-3 space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{item.productLabel}</p>
                    <p className="text-muted-foreground">{item.categoryLabel}</p>
                    {item.discountReason && (
                      <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                        {item.discountReason}
                      </p>
                    )}
                  </div>
                  {canViewFinance && (
                    <span className="ml-2 text-right font-semibold text-foreground">
                      {item.originalTotalEur != null &&
                        item.discountPct != null &&
                        item.discountPct > 0 &&
                        item.originalTotalEur > item.totalEur && (
                          <span className="mr-1 text-[0.7rem] font-normal text-muted-foreground/60 line-through">
                            {formatEur(item.originalTotalEur)}
                          </span>
                        )}
                      {formatEur(item.totalEur)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Customer note */}
          {order.customerNote && (
            <div className="rounded-lg border border-border/40 bg-card/60 p-5">
              <h3 className="text-sm font-semibold text-foreground">Note du client</h3>
              <p className="mt-2 text-xs text-foreground/80">{order.customerNote}</p>
            </div>
          )}

          {/* Source inquiry — present when this order was spawned by
              convertInquiryToOrder. Surfaces a one-click link back to
              the original inquiry so admin can re-read context or
              grab attached files without searching. */}
          {order.sourceInquiry && (
            <div className="rounded-lg border border-border bg-secondary/50 p-5">
              <h3 className="text-sm font-semibold text-foreground">
                Demande d’origine
              </h3>
              <dl className="mt-3 space-y-1.5 text-xs leading-relaxed">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="w-20 text-muted-foreground">Type :</dt>
                  <dd className="text-foreground">
                    {order.sourceInquiry.serviceType ?? "—"}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="w-20 text-muted-foreground">Reçue le :</dt>
                  <dd className="text-foreground">
                    {new Date(order.sourceInquiry.createdAt).toLocaleString(
                      "fr-FR",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </dd>
                </div>
                {order.sourceInquiry._count.files > 0 && (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="w-20 text-muted-foreground">Fichiers :</dt>
                    <dd className="text-foreground">
                      {order.sourceInquiry._count.files} joint(s) à la demande
                    </dd>
                  </div>
                )}
              </dl>
              <Link
                href={`/portal/admin/inquiries?highlight=${order.sourceInquiry.id}`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[0.78rem] font-medium text-foreground transition hover:bg-secondary"
              >
                Ouvrir la demande
              </Link>
            </div>
          )}

          {canViewFinance && (
            <>
          {/* Buyer identity (Phase A.1). For individual orders only the
              type label appears so the absence of company info is
              visually clear at a glance. */}
          <div className="rounded-lg border border-border/40 bg-card/60 p-5">
            <h3 className="text-sm font-semibold text-foreground">Type d’acheteur</h3>
            <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
              {order.buyerType === "business" ? "Entreprise" : "Particulier"}
            </p>
            {order.buyerType !== "individual" && (
              <dl className="mt-3 space-y-1.5 text-xs leading-relaxed">
                {order.companyName && (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="w-24 text-muted-foreground">Raison sociale :</dt>
                    <dd className="font-medium text-foreground">{order.companyName}</dd>
                  </div>
                )}
                {order.companyAddress && (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="w-24 text-muted-foreground">Adresse :</dt>
                    <dd className="text-foreground">{order.companyAddress}</dd>
                  </div>
                )}
                {order.companyTaxId && (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="w-24 text-muted-foreground">N° de TVA :</dt>
                    <dd className="font-mono text-foreground">{order.companyTaxId}</dd>
                  </div>
                )}
                {order.companyCountryCode && (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="w-24 text-muted-foreground">Pays :</dt>
                    <dd className="font-mono text-foreground">{order.companyCountryCode}</dd>
                  </div>
                )}
              </dl>
            )}

            {/* VIES VAT verification — only for business buyers. Shows
                the verified badge if a successful check ran, and the
                trigger button so admin can (re)check before issuing
                an export invoice with 0% VAT. */}
            {order.buyerType === "business" &&
              order.companyTaxId &&
              order.companyCountryCode && (
                <div className="mt-4 border-t border-border/40 pt-4">
                  {order.vatVerifiedAt ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/10 px-3 py-1 text-[0.72rem] font-medium text-foreground">
                        ✓ Vérifié via VIES{" "}
                        <span className="font-normal text-muted-foreground">
                          ·{" "}
                          {new Date(order.vatVerifiedAt).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                      {order.vatVerifiedName &&
                        order.vatVerifiedName !== order.companyName && (
                          <p className="text-[0.72rem] text-muted-foreground">
                            Nom VIES :{" "}
                            <span className="text-foreground">
                              {order.vatVerifiedName}
                            </span>{" "}
                            (diffère de la valeur saisie)
                          </p>
                        )}
                      {canManageFinance && (
                        <AdminVerifyVatButton orderId={order.id} />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[0.78rem] text-muted-foreground">
                        Le numéro de TVA n’a pas été vérifié via VIES. Avant
                        d’émettre une facture à l’export, la vérification est
                        recommandée.
                      </p>
                      {canManageFinance && (
                        <AdminVerifyVatButton orderId={order.id} />
                      )}
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Payment — provider snapshot + PayPal refund. The refund
              button appears only for completed PayPal payments with a
              capture id (that's what PayPal refunds). */}
          <div className="rounded-lg border border-border/40 bg-card/60 p-5">
            <h3 className="text-sm font-semibold text-foreground">Paiement</h3>
            <dl className="mt-3 space-y-1.5 text-xs leading-relaxed">
              <div className="flex flex-wrap gap-x-2">
                <dt className="w-24 text-muted-foreground">Prestataire :</dt>
                <dd className="text-foreground">
                  {order.paymentProvider ?? "—"}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="w-24 text-muted-foreground">Statut :</dt>
                <dd className="text-foreground">{order.paymentStatus}</dd>
              </div>
              {order.chargedAmountMinor != null &&
                isChargeCurrency(order.chargedCurrency) && (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="w-24 text-muted-foreground">Montant débité :</dt>
                    <dd className="text-foreground">
                      {formatChargeAmount(
                        order.chargedAmountMinor,
                        order.chargedCurrency,
                      )}
                      {order.chargedFxRate
                        ? ` (taux ${Number(order.chargedFxRate)})`
                        : ""}
                    </dd>
                  </div>
                )}
              {order.paypalCaptureId && (
                <div className="flex flex-wrap gap-x-2">
                  <dt className="w-24 text-muted-foreground">Capture :</dt>
                  <dd className="font-mono text-foreground">
                    {order.paypalCaptureId}
                    {order.paypalCaptureStatus
                      ? ` · ${order.paypalCaptureStatus}`
                      : ""}
                  </dd>
                </div>
              )}
              {order.paypalPayerEmail && (
                <div className="flex flex-wrap gap-x-2">
                  <dt className="w-24 text-muted-foreground">Payeur :</dt>
                  <dd className="text-foreground">{order.paypalPayerEmail}</dd>
                </div>
              )}
            </dl>
            {canManageFinance &&
              order.paymentProvider === "paypal" &&
              order.paymentStatus === "completed" &&
              order.paypalCaptureId && (
                <div className="mt-4 border-t border-border/40 pt-4">
                  <AdminRefundButton orderId={order.id} />
                </div>
              )}
          </div>

          {/* Proforma (proforma) — wire-transfer flow. Always visible
              so admin can issue/re-issue. The first issuance flips
              paymentMethod to wire_transfer; switching the order back
              to online_payment is a separate (currently manual) admin
              concern. */}
          <div className="rounded-lg border border-border/40 bg-card/60 p-5">
            <h3 className="text-sm font-semibold text-foreground">Facture proforma</h3>
            {order.proformaNumber && order.proformaIssuedAt ? (
              <>
                <dl className="mt-3 space-y-1.5 text-xs leading-relaxed">
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="w-24 text-muted-foreground">Numéro :</dt>
                    <dd className="font-mono text-foreground">
                      {order.proformaNumber}
                    </dd>
                  </div>
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="w-24 text-muted-foreground">Émise le :</dt>
                    <dd className="text-foreground">
                      {new Date(order.proformaIssuedAt).toLocaleString(
                        "fr-FR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </dd>
                  </div>
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="w-24 text-muted-foreground">Mode de règlement :</dt>
                    <dd className="text-foreground">
                      {order.paymentMethod === "wire_transfer"
                        ? "Virement bancaire (SWIFT)"
                        : "Paiement en ligne"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <a
                    href={`/api/portal/proforma/${order.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[0.78rem] font-medium text-foreground transition hover:bg-secondary"
                  >
                    Télécharger le PDF
                  </a>
                  {canManageFinance && (
                    <AdminProformaButton orderId={order.id} alreadyIssued />
                  )}
                  {order.paymentMethod === "wire_transfer" &&
                    order.paymentStatus !== "completed" &&
                    canManageFinance && (
                      <AdminMarkPaidButton orderId={order.id} />
                    )}
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-xs text-muted-foreground">
                  La facture proforma n’a pas encore été émise. Prévisualisez le
                  PDF pour vérifier les informations avant de l’envoyer au client
                  par e-mail.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={`/api/admin/proforma-preview/${order.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[0.78rem] font-medium text-foreground transition hover:bg-secondary"
                  >
                    Aperçu du PDF
                  </a>
                  {canManageFinance && (
                    <AdminProformaButton
                      orderId={order.id}
                      alreadyIssued={false}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          {/* Invoice failure recovery — payment landed but the
              post-payment hook didn't produce an invoiceNumber. Lets
              admin re-run the pipeline (Supabase outage, PDF render
              error, etc.). issueInvoice is idempotent. */}
          {order.paymentStatus === "completed" && !order.invoiceNumber && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
              <h3 className="text-sm font-semibold text-foreground">
                Facture — non émise
              </h3>
              <p className="mt-2 text-xs text-muted-foreground">
                La commande est payée, mais la facture définitive n’a pas été
                générée car le hook post-paiement a échoué. Relancez
                l’opération ; elle est idempotente et ne créera pas de facture
                en double.
              </p>
              <div className="mt-3">
                {canManageFinance && (
                  <AdminRetryInvoiceButton orderId={order.id} />
                )}
              </div>
            </div>
          )}

          {/* Invoice (Phase A.2). Shows up only after the payment hook
              has run; for unpaid orders the section is hidden. */}
          {order.invoiceNumber && order.invoiceIssuedAt && (
            <div className="rounded-lg border border-border/40 bg-card/60 p-5">
              <h3 className="text-sm font-semibold text-foreground">Facture</h3>
              <dl className="mt-3 space-y-1.5 text-xs leading-relaxed">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="w-24 text-muted-foreground">Numéro :</dt>
                  <dd className="font-mono text-foreground">{order.invoiceNumber}</dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="w-24 text-muted-foreground">Émise le :</dt>
                  <dd className="text-foreground">
                    {new Date(order.invoiceIssuedAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              </dl>
              <a
                href={`/api/portal/invoice/${order.id}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[0.78rem] font-medium text-background transition hover:opacity-90"
              >
                Télécharger le PDF
              </a>
              {orderPlutosSync && (
                <AdminPlutosSyncPanel
                  target="order"
                  targetId={order.id}
                  sync={orderPlutosSync}
                  requestAction={
                    canManageFinance ? requestPlutosSync : undefined
                  }
                  refreshAction={
                    canManageFinance ? refreshPlutosStatus : undefined
                  }
                  compact
                />
              )}
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
