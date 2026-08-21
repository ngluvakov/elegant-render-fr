/**
 * email.ts — Resend transactional email sender for the platform.
 *
 * Exports sendVerificationEmail, sendPasswordResetEmail,
 * sendOrderConfirmationEmail, sendPortalAccessEmail, and the VR
 * inquiry pair — all branded HTML templates in French.
 *
 * Used by: server/actions/auth, server/actions/checkout,
 *          server/actions/payment, server/actions/vr-inquiry
 */
import { Resend } from "resend";
import type { VrConfig } from "@/lib/catalog/vr-config";
import { IMPRINT, formatAddress } from "@/lib/content/site";

const FROM = process.env.EMAIL_FROM ?? "Elegant Render <noreply@elegantrender.com>";
const ADMIN_NOTIFY_EMAIL =
  process.env.ADMIN_NOTIFY_EMAIL ?? "info@elegantrender.com";

// Pick the host to embed in transactional links. Vercel preview deploys
// share AUTH_URL with production, so a magic link emitted from a preview
// would point at production where the new code may not exist yet.
// On preview we fall back to VERCEL_URL (the deployment-specific host)
// so the link round-trips back to the same deploy that minted it.
function getAuthUrl(): string {
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.AUTH_URL ?? "http://localhost:3000";
}

// Lazy-init so the module can be imported (and pages can render) even when
// RESEND_API_KEY isn't set — only an actual send call surfaces the error.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  _resend = new Resend(apiKey);
  return _resend;
}

async function send(args: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}) {
  const { error } = await getResend().emails.send({
    from: FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    ...(args.attachments?.length
      ? {
          attachments: args.attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
          })),
        }
      : {}),
  });
  if (error) {
    throw new Error(`Resend: ${error.name ?? "send_failed"} — ${error.message}`);
  }
}

function formatEmailEur(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

function formatEmailMoney(cents: number, _currency: "EUR" | null = "EUR"): string {
  void _currency;
  return formatEmailEur(cents / 100);
}

// ─── Email templates ─────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  token: string,
) {
  const url = `${getAuthUrl()}/verify-email?token=${token}`;

  await send({
    to,
    subject: "Confirmez votre adresse e-mail — Elegant Render",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Bienvenue chez Elegant Render</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Cliquez sur le bouton ci-dessous pour confirmer votre adresse e-mail et activer votre compte.
        </p>
        <a href="${url}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Confirmer l’adresse e-mail
        </a>
        <p style="color: #9ca3af; font-size: 13px;">
          Si vous n’êtes pas à l’origine de cette inscription, vous pouvez ignorer cet e-mail.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
) {
  const url = `${getAuthUrl()}/reset-password?token=${token}`;

  await send({
    to,
    subject: "Réinitialisez votre mot de passe — Elegant Render",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Réinitialisez votre mot de passe</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Nous avons reçu une demande de changement de votre mot de passe.
          Cliquez sur le bouton ci-dessous pour en définir un nouveau.
        </p>
        <a href="${url}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Définir un nouveau mot de passe
        </a>
        <p style="color: #9ca3af; font-size: 13px;">
          Le lien est valable 1 heure. Si vous n’avez pas demandé de
          changement de mot de passe, vous pouvez ignorer cet e-mail.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}

export async function sendPortalAccessEmail(
  to: string,
  token: string,
  orderNumber: string,
  orderId: string,
) {
  const url = `${getAuthUrl()}/portal-access?token=${token}&next=${encodeURIComponent(
    `/portal/orders/${orderId}`,
  )}`;

  await send({
    to,
    subject: `Accédez à votre commande ${orderNumber} — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Merci pour votre commande</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Votre commande <strong>${orderNumber}</strong> a bien été reçue.
          Cliquez sur le bouton ci-dessous pour ouvrir l’espace client et
          suivre l’avancement — sans mot de passe.
        </p>
        <a href="${url}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Ouvrir votre commande
        </a>
        <p style="color: #9ca3af; font-size: 13px;">
          Le lien est valable 7 jours et ne peut être utilisé qu’une seule
          fois — ensuite, votre session reste ouverte et vous pouvez définir
          un mot de passe dans l’espace client.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  orderNumber: string,
  totalEur: number,
  amountLabel?: string,
) {
  const portalUrl = `${getAuthUrl()}/portal`;
  const totalLabel = amountLabel ?? formatEmailEur(totalEur);

  await send({
    to,
    subject: `Confirmation de commande ${orderNumber} — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Commande reçue</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Votre commande <strong>${orderNumber}</strong> a bien été reçue et payée.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; font-size: 14px;">
            <strong>Numéro de commande :</strong> ${orderNumber}<br/>
            <strong>Total :</strong> ${escapeHtml(totalLabel)}
          </p>
        </div>
        <p style="color: #6e665d; line-height: 1.6;">
          Vous pouvez suivre l’état de votre commande dans l’espace client.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Ouvrir l’espace client
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}

export type WithdrawalNoticeEmailArgs = {
  reference: string;
  receivedAt: Date;
  consumerName: string;
  consumerEmail: string;
  orderNumber: string;
  contractDate?: string;
  serviceDescription?: string;
  message?: string;
};

function renderWithdrawalNotice(args: WithdrawalNoticeEmailArgs): string {
  const receivedAt = args.receivedAt.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Belgrade",
    timeZoneName: "short",
  });

  return `
    <div style="background:#f6f1ea; border-radius:8px; padding:16px; margin:16px 0;">
      <p style="margin:0; color:#1C1A19; line-height:1.7;">
        <strong>Référence :</strong> ${escapeHtml(args.reference)}<br/>
        <strong>Reçue le :</strong> ${escapeHtml(receivedAt)}<br/>
        <strong>Consommateur :</strong> ${escapeHtml(args.consumerName)}<br/>
        <strong>E-mail :</strong> ${escapeHtml(args.consumerEmail)}<br/>
        <strong>Numéro de commande :</strong> ${escapeHtml(args.orderNumber)}
        ${args.contractDate ? `<br/><strong>Date du contrat :</strong> ${escapeHtml(args.contractDate)}` : ""}
        ${args.serviceDescription ? `<br/><strong>Service :</strong> ${escapeHtml(args.serviceDescription)}` : ""}
      </p>
      ${
        args.message
          ? `<p style="margin:14px 0 0; color:#1C1A19; white-space:pre-wrap;"><strong>Informations complémentaires :</strong><br/>${escapeHtml(args.message)}</p>`
          : ""
      }
    </div>
  `;
}

/**
 * Records the consumer's online withdrawal statement in the team mailbox.
 * The public form sends this first so the notice is not reported as received
 * unless an operational copy exists outside the browser session.
 */
export async function sendWithdrawalNoticeAdminEmail(
  args: WithdrawalNoticeEmailArgs,
) {
  await send({
    to: ADMIN_NOTIFY_EMAIL,
    subject: `Rétractation de contrat — ${args.orderNumber} — ${args.reference}`,
    html: `
      <div style="font-family:sans-serif; max-width:640px; margin:0 auto;">
        <h2 style="color:#1C1A19;">Notification de rétractation en ligne reçue</h2>
        <p style="color:#6e665d; line-height:1.6;">
          Le consommateur a utilisé la fonction publique de rétractation et a
          fait la déclaration dénuée d’ambiguïté suivante : « Je vous notifie
          par la présente ma rétractation du contrat désigné ci-dessous. »
          Examinez la commande et appliquez les règles impératives de
          rétractation, sans traiter cet e-mail comme une simple demande
          d’annulation discrétionnaire.
        </p>
        ${renderWithdrawalNotice(args)}
        <hr style="border:none; border-top:1px solid #d8cec4; margin:24px 0;" />
        <p style="color:#9ca3af; font-size:12px;">${escapeHtml(IMPRINT.legalName)}</p>
      </div>
    `,
  });
}

/** Durable-medium acknowledgement required by the online withdrawal flow. */
export async function sendWithdrawalNoticeCustomerEmail(
  args: WithdrawalNoticeEmailArgs,
) {
  await send({
    to: args.consumerEmail,
    subject: `Notification de rétractation reçue — ${args.reference}`,
    html: `
      <div style="font-family:sans-serif; max-width:560px; margin:0 auto;">
        <h2 style="color:#1C1A19;">Votre notification de rétractation a bien été reçue</h2>
        <p style="color:#6e665d; line-height:1.6;">
          Nous confirmons que ${escapeHtml(IMPRINT.shortName)} a bien reçu
          votre déclaration de rétractation du contrat désigné ci-dessous.
          Conservez cet e-mail comme preuve du contenu et de la date de votre
          notification.
        </p>
        ${renderWithdrawalNotice(args)}
        <p style="color:#6e665d; line-height:1.6;">
          Nous examinerons l’état de la commande et vous contacterons au sujet
          des effets juridiques et financiers. Cet accusé de réception ne
          restreint aucun droit impératif du consommateur.
        </p>
        <hr style="border:none; border-top:1px solid #d8cec4; margin:24px 0;" />
        <p style="color:#9ca3af; font-size:12px;">
          ${escapeHtml(IMPRINT.legalName)} · ${escapeHtml(IMPRINT.email)}
        </p>
      </div>
    `,
  });
}

/**
 * Issued-invoice notification with the rendered PDF as an attachment.
 * Triggered from the invoice_issued_email outbox handler after
 * issueInvoice() finishes. Customer receives one email per order with
 * the legal document attached.
 */
export async function sendInvoiceIssuedEmail(args: {
  to: string;
  invoiceNumber: string;
  totalEur: number;
  amountLabel?: string;
  pdfBuffer: Buffer;
}) {
  const portalUrl = `${getAuthUrl()}/portal`;
  const filename = `invoice-${args.invoiceNumber}.pdf`;
  const amountLabel = args.amountLabel ?? formatEmailEur(args.totalEur);

  await send({
    to: args.to,
    subject: `Facture ${args.invoiceNumber} — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Votre facture</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Vous trouverez en pièce jointe la facture <strong>${escapeHtml(args.invoiceNumber)}</strong> correspondant à la commande que vous venez de régler.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; font-size: 14px;">
            <strong>N° de facture :</strong> ${escapeHtml(args.invoiceNumber)}<br/>
            <strong>Montant :</strong> ${escapeHtml(amountLabel)}
          </p>
        </div>
        <p style="color: #6e665d; line-height: 1.6;">
          Vous pouvez suivre l’état de la commande et télécharger vos fichiers dans l’espace client.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Ouvrir l’espace client
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
    attachments: [{ filename, content: args.pdfBuffer }],
  });
}

/**
 * Proforma invoice notification with the rendered PDF as an
 * attachment + bank instructions in the body. Triggered from the
 * proforma_issued_email outbox handler after issueProforma() finishes.
 */
export async function sendProformaIssuedEmail(args: {
  to: string;
  proformaNumber: string;
  totalEur: number;
  amountLabel?: string;
  dueDate: Date;
  pdfBuffer: Buffer;
}) {
  const filename = `proforma-${args.proformaNumber}.pdf`;
  const dueDateLabel = args.dueDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Belgrade",
  });
  const amountLabel = args.amountLabel ?? formatEmailEur(args.totalEur);

  await send({
    to: args.to,
    subject: `Facture proforma ${args.proformaNumber} — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Facture proforma à régler</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Vous trouverez en pièce jointe la facture proforma <strong>${escapeHtml(args.proformaNumber)}</strong>.
          Dès réception de votre paiement, nous émettrons la facture définitive et commencerons le travail.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; font-size: 14px;">
            <strong>N° de proforma :</strong> ${escapeHtml(args.proformaNumber)}<br/>
            <strong>Montant :</strong> ${escapeHtml(amountLabel)}<br/>
            <strong>Échéance :</strong> ${dueDateLabel}
          </p>
        </div>
        <p style="color: #6e665d; line-height: 1.6;">
          Les instructions de paiement détaillées (IBAN, référence de paiement) figurent dans le PDF joint.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
    attachments: [{ filename, content: args.pdfBuffer }],
  });
}

export async function sendInquiryConvertedEmail(args: {
  to: string;
  contactName: string;
  inquirySubject: string | null;
}) {
  const greeting = args.contactName ? ` ${args.contactName}` : "";
  const subjectLine = args.inquirySubject
    ? `votre demande « ${args.inquirySubject} »`
    : "votre demande";

  await send({
    to: args.to,
    subject: "Votre demande a été examinée — facture proforma en préparation",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Bonjour${escapeHtml(greeting)},</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Merci de nous avoir contactés. Nous avons examiné ${escapeHtml(subjectLine)}
          et préparons une facture proforma avec les instructions de virement bancaire.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Vous recevrez la facture proforma dans un e-mail séparé d’ici le
          prochain jour ouvré, avec un document PDF et les coordonnées de
          paiement exactes (IBAN, référence de paiement). Dès réception de
          votre paiement, nous émettons la facture définitive et commençons
          le travail.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Si vous avez des questions d’ici là, répondez simplement à cet
          e-mail — nous répondons le jour même.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}

// ─── VR consultation inquiries ───────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendAiCreditsExpiryReminderEmail(args: {
  to: string;
  creditsLabel: string;
  expiresAt: Date;
  daysLeft: 30 | 7;
}) {
  const portalUrl = `${getAuthUrl()}/portal/ai-studio/credits`;
  const dateLabel = args.expiresAt.toLocaleDateString("fr-FR");

  await send({
    to: args.to,
    subject: `Vos crédits AI Studio expirent dans ${args.daysLeft} jours — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Vos crédits AI Studio expirent bientôt</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Votre solde AI Studio actif est de <strong>${escapeHtml(args.creditsLabel)}</strong>,
          valable jusqu’au <strong>${escapeHtml(dateLabel)}</strong>.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Une nouvelle recharge prolonge la validité de l’ensemble de votre solde actif de 12 mois supplémentaires.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Recharger les crédits
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}

function configToBullets(config: VrConfig): string {
  const items: string[] = [];
  items.push(`<strong>Projet :</strong> ${escapeHtml(config.projectName)}`);
  items.push(`<strong>Type d’expérience :</strong> ${config.experienceType}`);
  items.push(`<strong>Appareil cible :</strong> ${config.targetDevice}`);
  if (config.locomotion)
    items.push(`<strong>Locomotion :</strong> ${config.locomotion}`);
  if (config.dayNightMode)
    items.push(`<strong>Jour/Nuit :</strong> ${config.dayNightMode}`);
  const interactions: string[] = [];
  if (config.doorInteraction) interactions.push("portes");
  if (config.lightsInteraction) interactions.push("éclairages");
  if (config.materialsInteraction) interactions.push("matériaux");
  if (interactions.length > 0) {
    items.push(`<strong>Interactions :</strong> ${interactions.join(", ")}`);
  }
  if (config.extraFloorsCount > 0)
    items.push(`<strong>Étages supplémentaires :</strong> ${config.extraFloorsCount}`);
  if (config.interactiveTypeCount > 0)
    items.push(
      `<strong>Types interactifs (nombre) :</strong> ${config.interactiveTypeCount}`,
    );
  if (config.brandingEnabled) items.push(`<strong>Branding :</strong> oui`);
  if (config.description) {
    items.push(
      `<strong>Description :</strong><br/>${escapeHtml(config.description).replace(/\n/g, "<br/>")}`,
    );
  }
  if (config.customInteractionDescription) {
    items.push(
      `<strong>Interactions personnalisées :</strong><br/>${escapeHtml(config.customInteractionDescription).replace(/\n/g, "<br/>")}`,
    );
  }
  return items.map((i) => `<li>${i}</li>`).join("\n");
}

export async function sendProjectInquiryAdminEmail(args: {
  inquiryId: string;
  adminUrl: string;
  contactName: string;
  email: string;
  phone?: string;
  company?: string;
  serviceType?: string;
  budget?: string;
  deadline?: string;
  message: string;
  sourceLabel?: string;
  fileCount: number;
  // Number of files that were NOT scanned (scanner unavailable). > 0 means
  // the files must be checked manually before opening.
  unscannedFileCount?: number;
}) {
  const unscanned = args.unscannedFileCount ?? 0;
  await send({
    to: ADMIN_NOTIFY_EMAIL,
    subject:
      unscanned > 0
        ? `⚠ Nouvelle demande (fichiers non analysés) — ${args.contactName}`
        : `Nouvelle demande de devis — ${args.contactName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Nouvelle demande de devis</h2>
        ${
          unscanned > 0
            ? `<div style="background: #fdecea; border: 1px solid #e5b3ab; border-radius: 8px; padding: 12px 16px; margin: 16px 0; color: #8a2c1c; line-height: 1.6;">
          <strong>⚠ ${unscanned} fichier(s) n’ont pas été analysés</strong> car le service
          antivirus était indisponible. Les fichiers sont placés en quarantaine — vérifiez-les
          manuellement (ou téléchargez-les dans un environnement sécurisé) avant de les ouvrir.
          La demande a tout de même été enregistrée afin de ne pas perdre le contact.
        </div>`
            : ""
        }
        <p style="color: #6e665d; line-height: 1.6;">
          ${escapeHtml(args.contactName)} a envoyé un brief succinct et attend
          une proposition de service chiffrée.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Contact :</strong></p>
          <ul style="margin: 0; padding-left: 18px; color: #1C1A19; line-height: 1.6;">
            <li>${escapeHtml(args.contactName)}</li>
            <li><a href="mailto:${escapeHtml(args.email)}">${escapeHtml(args.email)}</a></li>
            ${args.phone ? `<li>${escapeHtml(args.phone)}</li>` : ""}
            ${args.company ? `<li>${escapeHtml(args.company)}</li>` : ""}
          </ul>
        </div>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Brief :</strong></p>
          <p style="margin: 0; color: #1C1A19; line-height: 1.7;">
            ${args.serviceType ? `<strong>Service :</strong> ${escapeHtml(args.serviceType)}<br/>` : ""}
            ${args.budget ? `<strong>Budget :</strong> ${escapeHtml(args.budget)}<br/>` : ""}
            ${args.deadline ? `<strong>Délai :</strong> ${escapeHtml(args.deadline)}<br/>` : ""}
            ${args.sourceLabel ? `<strong>Source :</strong> ${escapeHtml(args.sourceLabel)}<br/>` : ""}
            <strong>Fichiers :</strong> ${args.fileCount}
          </p>
        </div>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Message du client :</strong></p>
          <p style="margin: 0; color: #1C1A19; white-space: pre-wrap;">${escapeHtml(args.message)}</p>
        </div>
        <a href="${args.adminUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Ouvrir la demande dans le panneau d’administration
        </a>
        <p style="color: #9ca3af; font-size: 12px;">ID de la demande : ${escapeHtml(args.inquiryId)}</p>
      </div>
    `,
  });
}

export async function sendProjectInquiryCustomerEmail(args: {
  to: string;
  contactName: string;
}) {
  await send({
    to: args.to,
    subject: "Votre demande a bien été reçue — Elegant Render",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Merci pour votre demande</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Bonjour ${escapeHtml(args.contactName)},
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Nous avons bien reçu la description de votre projet. Nous examinerons
          les éléments et reviendrons vers vous avec une proposition de service
          et un devis, généralement sous <strong>1 jour ouvré</strong>.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Si vous souhaitez ajouter d’autres références, vous pouvez répondre
          directement à cet e-mail.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}

export async function sendAiCreditsGrantedEmail(args: {
  to: string;
  grantedLabel: string;
  balanceLabel: string;
  note: string;
  expiresAt: Date;
}) {
  const portalUrl = `${getAuthUrl()}/portal/ai-studio`;
  const dateLabel = args.expiresAt.toLocaleDateString("fr-FR");

  await send({
    to: args.to,
    subject: `Vous avez reçu ${args.grantedLabel} AI Studio — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Des crédits AI Studio ont été ajoutés à votre compte</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Notre équipe vous a accordé <strong>${escapeHtml(args.grantedLabel)}</strong>.
          Votre nouveau solde actif est de <strong>${escapeHtml(args.balanceLabel)}</strong>,
          valable jusqu’au <strong>${escapeHtml(dateLabel)}</strong>.
        </p>
        ${
          args.note
            ? `<div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; line-height: 1.6;"><em>${escapeHtml(args.note)}</em></p>
        </div>`
            : ""
        }
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Ouvrir AI Studio
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}

export async function sendFreeRevisionGrantedEmail(args: {
  to: string;
  orderNumber: string;
  orderId: string;
  note: string;
}) {
  const portalUrl = `${getAuthUrl()}/portal/orders/${args.orderId}`;

  await send({
    to: args.to,
    subject: `Révision gratuite approuvée — commande ${args.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Votre révision a été approuvée</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Notre équipe a approuvé une révision gratuite sur la commande
          <strong>${escapeHtml(args.orderNumber)}</strong>.
          Nous commençons le travail — nous vous préviendrons dès qu’elle sera prête pour votre validation.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; line-height: 1.6;"><em>${escapeHtml(args.note)}</em></p>
        </div>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Ouvrir la commande
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}

export async function sendAdditionalChargeRequestedEmail(args: {
  to: string;
  orderNumber: string;
  orderId: string;
  totalCents: number;
  billingCurrency?: "EUR" | null;
  billingTotalCents?: number | null;
  reason: string;
  lines: Array<{
    label: string;
    quantity: number;
    amountCents: number;
    billingSubtotalCents?: number | null;
  }>;
}) {
  const portalUrl = `${getAuthUrl()}/portal/orders/${args.orderId}`;
  const totalEur = args.totalCents / 100;
  const totalLabel =
    args.billingCurrency && args.billingTotalCents != null
      ? formatEmailMoney(args.billingTotalCents, args.billingCurrency)
      : formatEmailEur(totalEur);
  const linesHtml = args.lines
    .map((line) => {
      const subtotal = (line.amountCents * line.quantity) / 100;
      const subtotalLabel =
        args.billingCurrency && line.billingSubtotalCents != null
          ? formatEmailMoney(line.billingSubtotalCents, args.billingCurrency)
          : formatEmailEur(subtotal);
      return `<li>
        ${escapeHtml(line.label)}
        ${line.quantity > 1 ? ` × ${line.quantity}` : ""}
        — <strong>${escapeHtml(subtotalLabel)}</strong>
      </li>`;
    })
    .join("\n");

  await send({
    to: args.to,
    subject: `Frais supplémentaires sur la commande ${args.orderNumber} — ${totalLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Frais supplémentaires</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Des frais supplémentaires ont été créés sur la commande
          <strong>${escapeHtml(args.orderNumber)}</strong> pour des éléments
          hors du périmètre initial.
        </p>
        ${
          args.reason
            ? `<div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; line-height: 1.6;"><em>${escapeHtml(args.reason)}</em></p>
        </div>`
            : ""
        }
        <ul style="color: #1C1A19; line-height: 1.7; padding-left: 20px;">
          ${linesHtml}
        </ul>
        <p style="color: #1C1A19; font-size: 16px; margin: 16px 0;">
          <strong>Total à régler : ${escapeHtml(totalLabel)}</strong>
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Ouvrez la commande dans l’espace client pour vérifier les éléments
          et effectuer le paiement. Tous les moyens de paiement de votre
          commande initiale sont disponibles.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Ouvrir la commande et payer
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}

export async function sendAdditionalChargePaidEmail(args: {
  to: string;
  orderNumber: string;
  orderId: string;
  totalCents: number;
  billingCurrency?: "EUR" | null;
  billingTotalCents?: number | null;
}) {
  const portalUrl = `${getAuthUrl()}/portal/orders/${args.orderId}`;
  const totalEur = args.totalCents / 100;
  const totalLabel =
    args.billingCurrency && args.billingTotalCents != null
      ? formatEmailMoney(args.billingTotalCents, args.billingCurrency)
      : formatEmailEur(totalEur);

  await send({
    to: args.to,
    subject: `Frais supplémentaires payés — commande ${args.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Paiement reçu</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Merci. Votre paiement des frais supplémentaires sur la commande
          <strong>${escapeHtml(args.orderNumber)}</strong> a bien été reçu.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19;">
            <strong>Montant :</strong> ${escapeHtml(totalLabel)}
          </p>
        </div>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Ouvrir la commande
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}

export async function sendVrInquiryAdminEmail(args: {
  inquiryId: string;
  productLabel: string;
  contactName: string;
  email: string;
  phone?: string;
  message?: string;
  config: VrConfig;
}) {
  const adminUrl = `${getAuthUrl()}/portal/admin/vr-inquiries`;
  await send({
    to: ADMIN_NOTIFY_EMAIL,
    subject: `Nouvelle demande VR — ${args.contactName} (${args.productLabel})`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Nouvelle demande VR</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          ${escapeHtml(args.contactName)} a rempli le formulaire de consultation pour
          <strong>${escapeHtml(args.productLabel)}</strong>.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Contact :</strong></p>
          <ul style="margin: 0; padding-left: 18px; color: #1C1A19;">
            <li>${escapeHtml(args.contactName)}</li>
            <li><a href="mailto:${escapeHtml(args.email)}">${escapeHtml(args.email)}</a></li>
            ${args.phone ? `<li>${escapeHtml(args.phone)}</li>` : ""}
          </ul>
        </div>
        ${
          args.message
            ? `
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Message du client :</strong></p>
          <p style="margin: 0; color: #1C1A19; white-space: pre-wrap;">${escapeHtml(args.message)}</p>
        </div>`
            : ""
        }
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Configuration :</strong></p>
          <ul style="margin: 0; padding-left: 18px; color: #1C1A19; line-height: 1.6;">
            ${configToBullets(args.config)}
          </ul>
        </div>
        <a href="${adminUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Ouvrir la demande dans le panneau d’administration
        </a>
      </div>
    `,
  });
}

export async function sendVrProjectReadyEmail(args: {
  to: string;
  contactName: string;
  productLabel: string;
  projectName: string;
  priceEur: number;
  orderNumber: string;
  orderId: string;
  token: string;
}) {
  const url = `${getAuthUrl()}/portal-access?token=${args.token}&next=${encodeURIComponent(
    `/portal/orders/${args.orderId}`,
  )}`;
  await send({
    to: args.to,
    subject: `Votre projet VR est prêt pour le paiement — ${args.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Périmètre validé</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Bonjour ${escapeHtml(args.contactName)},
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Merci pour cet échange — nous avons défini le périmètre du projet
          et préparé votre commande pour le paiement.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; line-height: 1.7;">
            <strong>Projet :</strong> ${escapeHtml(args.projectName)}<br/>
            <strong>Service :</strong> ${escapeHtml(args.productLabel)}<br/>
            <strong>Numéro de commande :</strong> ${escapeHtml(args.orderNumber)}<br/>
            <strong>Montant :</strong> ${formatEmailEur(args.priceEur)}
          </p>
        </div>
        <p style="color: #6e665d; line-height: 1.6;">
          Cliquez sur le bouton ci-dessous pour ouvrir la commande et
          effectuer le paiement. Le lien vous connecte directement à
          l’espace client — sans mot de passe.
        </p>
        <a href="${url}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Ouvrir et payer
        </a>
        <p style="color: #9ca3af; font-size: 13px;">
          Le lien est valable 7 jours et ne peut être utilisé qu’une seule
          fois — ensuite, votre session reste ouverte et vous pouvez définir
          un mot de passe dans l’espace client.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}

// ─── PayPal — payment success / failure receipts ─────────
//
// Simple French receipts: order number, line items, EUR total, the
// charged amount/currency (when the buyer paid in a non-EUR
// presentment currency) and the PayPal capture id. Amount labels are
// pre-formatted strings supplied by the outbox loader.

export type PaymentEmailLineItem = {
  label: string;
  totalLabel: string;
};

function renderPaymentLineItems(items: PaymentEmailLineItem[]): string {
  if (!items.length) return "";
  return `
    <table style="width:100%; font-size:13px; color:#1C1A19; border-collapse:collapse;">
      <tbody>
        ${items
          .map(
            (line) => `
              <tr style="border-bottom:1px solid #f0e8de;">
                <td style="padding:6px 6px 6px 0;">${escapeHtml(line.label)}</td>
                <td align="right" style="padding:6px 0 6px 6px;">${escapeHtml(line.totalLabel)}</td>
              </tr>`,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderPaymentReceiptBlock(args: {
  orderNumber: string;
  lineItems: PaymentEmailLineItem[];
  totalEurLabel: string;
  chargedLabel: string | null;
  captureId: string | null;
}): string {
  return `
    <h3 style="color:#1C1A19; font-size:14px; margin:24px 0 8px;">Détail de la commande</h3>
    <p style="margin:0 0 8px; color:#1C1A19; font-size:13px;">
      <strong>Numéro de commande :</strong> ${escapeHtml(args.orderNumber)}
    </p>
    ${renderPaymentLineItems(args.lineItems)}
    <p style="margin:8px 0 0; color:#1C1A19; font-size:14px;">
      <strong>Total : ${escapeHtml(args.totalEurLabel)}</strong>
      ${
        args.chargedLabel
          ? `<br/><span style="color:#6e665d; font-size:13px;">Montant débité : ${escapeHtml(args.chargedLabel)} — votre facture est émise en EUR.</span>`
          : ""
      }
      ${
        args.captureId
          ? `<br/><span style="color:#6e665d; font-size:13px;">ID de transaction PayPal : <span style="font-family:monospace;">${escapeHtml(args.captureId)}</span></span>`
          : ""
      }
    </p>
    <h3 style="color:#1C1A19; font-size:14px; margin:24px 0 8px;">Vendeur</h3>
    <p style="margin:0; color:#1C1A19; line-height:1.6; font-size:13px;">
      <strong>${escapeHtml(IMPRINT.shortName)}</strong><br/>
      ${escapeHtml(IMPRINT.legalName)}<br/>
      ${escapeHtml(formatAddress())}<br/>
      ${escapeHtml(IMPRINT.email)}
    </p>
  `;
}

export async function sendPaymentSuccessEmail(args: {
  to: string;
  orderNumber: string;
  customerName: string | null;
  lineItems: PaymentEmailLineItem[];
  totalEurLabel: string;
  /** e.g. "$199 (USD)" — null when the buyer was charged in EUR. */
  chargedLabel: string | null;
  captureId: string | null;
}) {
  const portalUrl = `${getAuthUrl()}/portal`;

  await send({
    to: args.to,
    subject: `Paiement reçu — commande ${args.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Paiement reçu</h2>
        <p style="color: #1C1A19; line-height: 1.6; margin:0 0 16px;">
          ${args.customerName ? `Bonjour ${escapeHtml(args.customerName)}, ` : ""}votre
          paiement PayPal a bien été reçu — merci.
        </p>

        ${renderPaymentReceiptBlock(args)}

        <p style="color: #6e665d; line-height: 1.6; margin-top:24px;">
          Vous pouvez suivre l’état de la commande et télécharger vos
          documents dans l’espace client.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px 0;">
          Ouvrir votre espace client
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}

export async function sendPaymentFailureEmail(args: {
  to: string;
  orderNumber: string;
  customerName: string | null;
  lineItems: PaymentEmailLineItem[];
  totalEurLabel: string;
  chargedLabel: string | null;
  reason: string | null;
  retryUrl: string;
}) {
  await send({
    to: args.to,
    subject: `Paiement non abouti — commande ${args.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Paiement non abouti</h2>
        <p style="color: #1C1A19; line-height: 1.6; margin:0 0 16px;">
          ${args.customerName ? `Bonjour ${escapeHtml(args.customerName)}, ` : ""}votre
          paiement PayPal n’a pas abouti — aucun montant ne vous a été débité.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Votre commande est enregistrée et vous pouvez réessayer depuis votre
          espace client. Si PayPal a refusé le paiement à plusieurs reprises,
          vérifiez votre compte PayPal ou essayez un autre moyen de paiement.
        </p>
        ${
          args.reason
            ? `<p style="color:#6e665d; font-size:13px;">Statut du prestataire : <span style="font-family:monospace;">${escapeHtml(args.reason)}</span></p>`
            : ""
        }

        ${renderPaymentReceiptBlock({ ...args, captureId: null })}

        <a href="${args.retryUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Réessayer
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}

export async function sendVrInquiryCustomerEmail(args: {
  to: string;
  contactName: string;
  productLabel: string;
}) {
  await send({
    to: args.to,
    subject: `Votre demande VR a bien été reçue — ${args.productLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Merci pour votre demande</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Bonjour ${escapeHtml(args.contactName)},
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Nous avons bien reçu votre demande concernant <strong>${escapeHtml(args.productLabel)}</strong>.
          Les projets VR nécessitent un échange sur le périmètre, les appareils
          cibles et les détails techniques — nous reviendrons vers vous sous
          <strong>1 jour ouvré</strong> pour convenir d’une consultation.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Si vous avez des fichiers ou références supplémentaires à partager
          dès maintenant, répondez simplement à cet e-mail.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}

export async function sendJobApplicationAdminEmail(args: {
  applicationId: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  position: string;
  employmentType?: string;
  availableFrom?: string;
  expectedSalary?: string;
  experienceYears?: string;
  education?: string;
  coverLetter: string;
  software: string[];
  softwareOther?: string;
  skills: string[];
  skillsOther?: string;
  /** Signed download links (30 days) for the attached files. */
  fileLinks: Array<{ label: string; url: string | null; fileName: string }>;
  unscannedFileCount?: number;
}) {
  const unscanned = args.unscannedFileCount ?? 0;
  const listOrDash = (items: string[], other?: string) => {
    const all = [...items, ...(other ? [other] : [])];
    return all.length ? escapeHtml(all.join(", ")) : "—";
  };
  await send({
    to: ADMIN_NOTIFY_EMAIL,
    subject:
      unscanned > 0
        ? `⚠ Nouvelle candidature (fichiers non analysés) — ${args.fullName}`
        : `Nouvelle candidature — ${args.fullName} (${args.position})`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Nouvelle candidature</h2>
        ${
          unscanned > 0
            ? `<div style="background: #fdecea; border: 1px solid #e5b3ab; border-radius: 8px; padding: 12px 16px; margin: 16px 0; color: #8a2c1c; line-height: 1.6;">
          <strong>⚠ ${unscanned} fichier(s) n’ont pas été analysés</strong> car le service
          antivirus était indisponible. Vérifiez-les manuellement (ou téléchargez-les dans un
          environnement sécurisé) avant de les ouvrir.
        </div>`
            : ""
        }
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Candidat :</strong></p>
          <ul style="margin: 0; padding-left: 18px; color: #1C1A19; line-height: 1.6;">
            <li>${escapeHtml(args.fullName)}</li>
            <li><a href="mailto:${escapeHtml(args.email)}">${escapeHtml(args.email)}</a></li>
            ${args.phone ? `<li>${escapeHtml(args.phone)}</li>` : ""}
            ${args.location ? `<li>${escapeHtml(args.location)}</li>` : ""}
            ${args.linkedinUrl ? `<li><a href="${escapeHtml(args.linkedinUrl)}">${escapeHtml(args.linkedinUrl)}</a></li>` : ""}
            ${args.portfolioUrl ? `<li><a href="${escapeHtml(args.portfolioUrl)}">${escapeHtml(args.portfolioUrl)}</a></li>` : ""}
          </ul>
        </div>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Candidature :</strong></p>
          <p style="margin: 0; color: #1C1A19; line-height: 1.7;">
            <strong>Poste :</strong> ${escapeHtml(args.position)}<br/>
            ${args.employmentType ? `<strong>Type :</strong> ${escapeHtml(args.employmentType)}<br/>` : ""}
            ${args.availableFrom ? `<strong>Disponible à partir du :</strong> ${escapeHtml(args.availableFrom)}<br/>` : ""}
            ${args.expectedSalary ? `<strong>Prétentions salariales :</strong> ${escapeHtml(args.expectedSalary)}<br/>` : ""}
            ${args.experienceYears ? `<strong>Expérience :</strong> ${escapeHtml(args.experienceYears)}<br/>` : ""}
            ${args.education ? `<strong>Formation :</strong> ${escapeHtml(args.education)}<br/>` : ""}
          </p>
        </div>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Logiciels :</strong></p>
          <p style="margin: 0 0 12px 0; color: #1C1A19; line-height: 1.7;">${listOrDash(args.software, args.softwareOther)}</p>
          <p style="margin: 0 0 8px 0;"><strong>Compétences 3D :</strong></p>
          <p style="margin: 0; color: #1C1A19; line-height: 1.7;">${listOrDash(args.skills, args.skillsOther)}</p>
        </div>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Lettre de motivation :</strong></p>
          <p style="margin: 0; color: #1C1A19; white-space: pre-wrap;">${escapeHtml(args.coverLetter)}</p>
        </div>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Pièces jointes (liens valables 30 jours) :</strong></p>
          <ul style="margin: 0; padding-left: 18px; color: #1C1A19; line-height: 1.6;">
            ${args.fileLinks
              .map((f) =>
                f.url
                  ? `<li><a href="${escapeHtml(f.url)}">${escapeHtml(f.label)}: ${escapeHtml(f.fileName)}</a></li>`
                  : `<li>${escapeHtml(f.label)}: ${escapeHtml(f.fileName)} (lien indisponible — à télécharger depuis le stockage)</li>`,
              )
              .join("")}
          </ul>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">ID de la candidature : ${escapeHtml(args.applicationId)}</p>
      </div>
    `,
  });
}

export async function sendJobApplicationCandidateEmail(args: {
  to: string;
  fullName: string;
  position: string;
}) {
  await send({
    to: args.to,
    subject: "Votre candidature a bien été reçue — Elegant Render",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Merci pour votre candidature</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Bonjour ${escapeHtml(args.fullName)},
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Nous avons bien reçu votre candidature pour le poste de
          <strong>${escapeHtml(args.position)}</strong>, accompagnée de votre
          CV et de votre portfolio. Notre équipe examine chaque candidature —
          si votre profil correspond à ce que nous recherchons, nous vous
          contacterons pour convenir d’un entretien.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Si vous souhaitez ajouter un élément, vous pouvez répondre
          directement à cet e-mail.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — une marque de White Rook DOO</p>
      </div>
    `,
  });
}
