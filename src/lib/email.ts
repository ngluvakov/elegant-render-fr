/**
 * email.ts — Resend transactional email sender for the platform.
 *
 * Exports sendVerificationEmail, sendPasswordResetEmail,
 * sendOrderConfirmationEmail, sendPortalAccessEmail, and the VR
 * inquiry pair — all branded HTML templates in English.
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
  return new Intl.NumberFormat("en-GB", {
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
    subject: "Confirm your email address — Elegant Render",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Welcome to Elegant Render</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Click the button below to confirm your email address and activate your account.
        </p>
        <a href="${url}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Confirm email
        </a>
        <p style="color: #9ca3af; font-size: 13px;">
          If you did not create an account, you can ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
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
    subject: "Reset your password — Elegant Render",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Reset your password</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          We received a request to change your password. Click the button
          below to set a new one.
        </p>
        <a href="${url}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Set a new password
        </a>
        <p style="color: #9ca3af; font-size: 13px;">
          The link is valid for 1 hour. If you did not request a password
          change, you can ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
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
    subject: `Access your order ${orderNumber} — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Thank you for your order</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Your order <strong>${orderNumber}</strong> has been received.
          Click the button below to open the portal and follow progress —
          no password needed.
        </p>
        <a href="${url}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Open your order
        </a>
        <p style="color: #9ca3af; font-size: 13px;">
          The link is valid for 7 days and can be used only once — after
          that you will be signed in and can set a password in the portal.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
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
    subject: `Order confirmation ${orderNumber} — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Order received</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Your order <strong>${orderNumber}</strong> has been received and paid.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; font-size: 14px;">
            <strong>Order number:</strong> ${orderNumber}<br/>
            <strong>Total:</strong> ${escapeHtml(totalLabel)}
          </p>
        </div>
        <p style="color: #6e665d; line-height: 1.6;">
          You can follow the status of your order in the portal.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Open the portal
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
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
  const receivedAt = args.receivedAt.toLocaleString("en-GB", {
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
        <strong>Reference:</strong> ${escapeHtml(args.reference)}<br/>
        <strong>Received:</strong> ${escapeHtml(receivedAt)}<br/>
        <strong>Consumer:</strong> ${escapeHtml(args.consumerName)}<br/>
        <strong>Email:</strong> ${escapeHtml(args.consumerEmail)}<br/>
        <strong>Order number:</strong> ${escapeHtml(args.orderNumber)}
        ${args.contractDate ? `<br/><strong>Contract date:</strong> ${escapeHtml(args.contractDate)}` : ""}
        ${args.serviceDescription ? `<br/><strong>Service:</strong> ${escapeHtml(args.serviceDescription)}` : ""}
      </p>
      ${
        args.message
          ? `<p style="margin:14px 0 0; color:#1C1A19; white-space:pre-wrap;"><strong>Additional information:</strong><br/>${escapeHtml(args.message)}</p>`
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
    subject: `Contract withdrawal — ${args.orderNumber} — ${args.reference}`,
    html: `
      <div style="font-family:sans-serif; max-width:640px; margin:0 auto;">
        <h2 style="color:#1C1A19;">Online withdrawal notice received</h2>
        <p style="color:#6e665d; line-height:1.6;">
          The consumer used the public withdrawal function and made the
          following unambiguous statement: “I withdraw from the contract
          identified below.” Review the order and apply the mandatory
          withdrawal rules without treating this email as a discretionary
          cancellation request.
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
    subject: `Withdrawal notice received — ${args.reference}`,
    html: `
      <div style="font-family:sans-serif; max-width:560px; margin:0 auto;">
        <h2 style="color:#1C1A19;">Your withdrawal notice was received</h2>
        <p style="color:#6e665d; line-height:1.6;">
          We confirm that ${escapeHtml(IMPRINT.shortName)} received your
          statement withdrawing from the contract identified below. Keep this
          email as evidence of the content and time of your notice.
        </p>
        ${renderWithdrawalNotice(args)}
        <p style="color:#6e665d; line-height:1.6;">
          We will review the order status and contact you about the legal and
          payment effects. This acknowledgement does not reduce any mandatory
          consumer right.
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
    subject: `Invoice ${args.invoiceNumber} — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Your invoice</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Attached is invoice <strong>${escapeHtml(args.invoiceNumber)}</strong> for the order you just paid.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; font-size: 14px;">
            <strong>Invoice number:</strong> ${escapeHtml(args.invoiceNumber)}<br/>
            <strong>Amount:</strong> ${escapeHtml(amountLabel)}
          </p>
        </div>
        <p style="color: #6e665d; line-height: 1.6;">
          You can follow the order status and download your files in the portal.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Open the portal
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
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
  const dueDateLabel = args.dueDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Belgrade",
  });
  const amountLabel = args.amountLabel ?? formatEmailEur(args.totalEur);

  await send({
    to: args.to,
    subject: `Proforma invoice ${args.proformaNumber} — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Proforma invoice for payment</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Attached is proforma invoice <strong>${escapeHtml(args.proformaNumber)}</strong>.
          Once your payment arrives we will issue the final invoice and start the work.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; font-size: 14px;">
            <strong>Proforma number:</strong> ${escapeHtml(args.proformaNumber)}<br/>
            <strong>Amount:</strong> ${escapeHtml(amountLabel)}<br/>
            <strong>Payment due:</strong> ${dueDateLabel}
          </p>
        </div>
        <p style="color: #6e665d; line-height: 1.6;">
          Detailed payment instructions (IBAN, payment reference) are in the attached PDF.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
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
    ? `your inquiry "${args.inquirySubject}"`
    : "your inquiry";

  await send({
    to: args.to,
    subject: "We reviewed your inquiry — proforma invoice on its way",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Hello${escapeHtml(greeting)},</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Thank you for getting in touch. We reviewed ${escapeHtml(subjectLine)}
          and are preparing a proforma invoice with bank transfer instructions.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          You will receive the proforma invoice in a separate email within the
          next working day, with a PDF document and exact payment details
          (IBAN, payment reference). Once your payment arrives we issue the
          final invoice and start the work.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          If you have any questions in the meantime, simply reply to this
          email — we respond the same day.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
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
  const dateLabel = args.expiresAt.toLocaleDateString("en-GB");

  await send({
    to: args.to,
    subject: `AI credits expire in ${args.daysLeft} days — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">AI credits expire soon</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Your active AI Studio balance is <strong>${escapeHtml(args.creditsLabel)}</strong>
          and is valid until <strong>${escapeHtml(dateLabel)}</strong>.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          A new top-up extends the validity of your entire active balance for another 12 months.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Top up credits
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
      </div>
    `,
  });
}

function configToBullets(config: VrConfig): string {
  const items: string[] = [];
  items.push(`<strong>Project:</strong> ${escapeHtml(config.projectName)}`);
  items.push(`<strong>Experience type:</strong> ${config.experienceType}`);
  items.push(`<strong>Target device:</strong> ${config.targetDevice}`);
  if (config.locomotion)
    items.push(`<strong>Locomotion:</strong> ${config.locomotion}`);
  if (config.dayNightMode)
    items.push(`<strong>Day/Night:</strong> ${config.dayNightMode}`);
  const interactions: string[] = [];
  if (config.doorInteraction) interactions.push("doors");
  if (config.lightsInteraction) interactions.push("lights");
  if (config.materialsInteraction) interactions.push("materials");
  if (interactions.length > 0) {
    items.push(`<strong>Interactions:</strong> ${interactions.join(", ")}`);
  }
  if (config.extraFloorsCount > 0)
    items.push(`<strong>Extra floors:</strong> ${config.extraFloorsCount}`);
  if (config.interactiveTypeCount > 0)
    items.push(
      `<strong>Interactive types (count):</strong> ${config.interactiveTypeCount}`,
    );
  if (config.brandingEnabled) items.push(`<strong>Branding:</strong> yes`);
  if (config.description) {
    items.push(
      `<strong>Description:</strong><br/>${escapeHtml(config.description).replace(/\n/g, "<br/>")}`,
    );
  }
  if (config.customInteractionDescription) {
    items.push(
      `<strong>Custom interactions:</strong><br/>${escapeHtml(config.customInteractionDescription).replace(/\n/g, "<br/>")}`,
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
        ? `⚠ New inquiry (files not scanned) — ${args.contactName}`
        : `New estimate inquiry — ${args.contactName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">New estimate inquiry</h2>
        ${
          unscanned > 0
            ? `<div style="background: #fdecea; border: 1px solid #e5b3ab; border-radius: 8px; padding: 12px 16px; margin: 16px 0; color: #8a2c1c; line-height: 1.6;">
          <strong>⚠ ${unscanned} file(s) were not scanned</strong> because the antivirus
          service was unavailable. The files are held in quarantine — check them manually
          (or download them in a safe environment) before opening. The inquiry was still
          saved so the lead is not lost.
        </div>`
            : ""
        }
        <p style="color: #6e665d; line-height: 1.6;">
          ${escapeHtml(args.contactName)} sent a short brief and expects
          a service proposal with pricing.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Contact:</strong></p>
          <ul style="margin: 0; padding-left: 18px; color: #1C1A19; line-height: 1.6;">
            <li>${escapeHtml(args.contactName)}</li>
            <li><a href="mailto:${escapeHtml(args.email)}">${escapeHtml(args.email)}</a></li>
            ${args.phone ? `<li>${escapeHtml(args.phone)}</li>` : ""}
            ${args.company ? `<li>${escapeHtml(args.company)}</li>` : ""}
          </ul>
        </div>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Brief:</strong></p>
          <p style="margin: 0; color: #1C1A19; line-height: 1.7;">
            ${args.serviceType ? `<strong>Service:</strong> ${escapeHtml(args.serviceType)}<br/>` : ""}
            ${args.budget ? `<strong>Budget:</strong> ${escapeHtml(args.budget)}<br/>` : ""}
            ${args.deadline ? `<strong>Deadline:</strong> ${escapeHtml(args.deadline)}<br/>` : ""}
            ${args.sourceLabel ? `<strong>Source:</strong> ${escapeHtml(args.sourceLabel)}<br/>` : ""}
            <strong>Files:</strong> ${args.fileCount}
          </p>
        </div>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Client message:</strong></p>
          <p style="margin: 0; color: #1C1A19; white-space: pre-wrap;">${escapeHtml(args.message)}</p>
        </div>
        <a href="${args.adminUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Open inquiry in the admin panel
        </a>
        <p style="color: #9ca3af; font-size: 12px;">Inquiry ID: ${escapeHtml(args.inquiryId)}</p>
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
    subject: "Your inquiry has been received — Elegant Render",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Thank you for your inquiry</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Hello ${escapeHtml(args.contactName)},
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          We received your project description. We will review the materials
          and get back to you with a service proposal and an estimate,
          usually within <strong>1 working day</strong>.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          If you would like to add more references, you can reply directly
          to this email.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
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
  const dateLabel = args.expiresAt.toLocaleDateString("en-GB");

  await send({
    to: args.to,
    subject: `You received ${args.grantedLabel} AI credits — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">We added AI credits to your account</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Our team granted you <strong>${escapeHtml(args.grantedLabel)}</strong>.
          Your new active balance is <strong>${escapeHtml(args.balanceLabel)}</strong>
          and is valid until <strong>${escapeHtml(dateLabel)}</strong>.
        </p>
        ${
          args.note
            ? `<div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; line-height: 1.6;"><em>${escapeHtml(args.note)}</em></p>
        </div>`
            : ""
        }
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Open AI Studio
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
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
    subject: `Free revision approved — order ${args.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Your revision has been approved</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Our team approved a free revision on order
          <strong>${escapeHtml(args.orderNumber)}</strong>.
          We are starting the work — you will be notified when it is ready for review.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; line-height: 1.6;"><em>${escapeHtml(args.note)}</em></p>
        </div>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Open order
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
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
    subject: `Additional charge on order ${args.orderNumber} — ${totalLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Additional charge</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          An additional charge has been created on order
          <strong>${escapeHtml(args.orderNumber)}</strong> for items outside
          the original scope.
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
          <strong>Total due: ${escapeHtml(totalLabel)}</strong>
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Open the order in the portal to review the items and complete the
          payment. All payment options from your original order are available.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Open order and pay
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
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
    subject: `Additional charge paid — order ${args.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Payment received</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Thank you. Your payment for the additional charge on order
          <strong>${escapeHtml(args.orderNumber)}</strong> has been received.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19;">
            <strong>Amount:</strong> ${escapeHtml(totalLabel)}
          </p>
        </div>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Open order
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
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
    subject: `New VR inquiry — ${args.contactName} (${args.productLabel})`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">New VR inquiry</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          ${escapeHtml(args.contactName)} completed the consultation intake for
          <strong>${escapeHtml(args.productLabel)}</strong>.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Contact:</strong></p>
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
          <p style="margin: 0 0 8px 0;"><strong>Client message:</strong></p>
          <p style="margin: 0; color: #1C1A19; white-space: pre-wrap;">${escapeHtml(args.message)}</p>
        </div>`
            : ""
        }
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Configuration:</strong></p>
          <ul style="margin: 0; padding-left: 18px; color: #1C1A19; line-height: 1.6;">
            ${configToBullets(args.config)}
          </ul>
        </div>
        <a href="${adminUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Open inquiry in the admin panel
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
    subject: `Your VR project is ready for payment — ${args.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Scope agreed</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Hello ${escapeHtml(args.contactName)},
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Thank you for the conversation — we defined the project scope and
          prepared your order for payment.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; line-height: 1.7;">
            <strong>Project:</strong> ${escapeHtml(args.projectName)}<br/>
            <strong>Service:</strong> ${escapeHtml(args.productLabel)}<br/>
            <strong>Order number:</strong> ${escapeHtml(args.orderNumber)}<br/>
            <strong>Amount:</strong> ${formatEmailEur(args.priceEur)}
          </p>
        </div>
        <p style="color: #6e665d; line-height: 1.6;">
          Click the button below to open the order and complete the payment.
          The link signs you straight into the portal — no password needed.
        </p>
        <a href="${url}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Open and pay
        </a>
        <p style="color: #9ca3af; font-size: 13px;">
          The link is valid for 7 days and can be used only once — after
          that you will be signed in and can set a password in the portal.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
      </div>
    `,
  });
}

// ─── PayPal — payment success / failure receipts ─────────
//
// Simple English receipts: order number, line items, EUR total, the
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
    <h3 style="color:#1C1A19; font-size:14px; margin:24px 0 8px;">Order details</h3>
    <p style="margin:0 0 8px; color:#1C1A19; font-size:13px;">
      <strong>Order number:</strong> ${escapeHtml(args.orderNumber)}
    </p>
    ${renderPaymentLineItems(args.lineItems)}
    <p style="margin:8px 0 0; color:#1C1A19; font-size:14px;">
      <strong>Total: ${escapeHtml(args.totalEurLabel)}</strong>
      ${
        args.chargedLabel
          ? `<br/><span style="color:#6e665d; font-size:13px;">Charged: ${escapeHtml(args.chargedLabel)} — your invoice is issued in EUR.</span>`
          : ""
      }
      ${
        args.captureId
          ? `<br/><span style="color:#6e665d; font-size:13px;">PayPal transaction id: <span style="font-family:monospace;">${escapeHtml(args.captureId)}</span></span>`
          : ""
      }
    </p>
    <h3 style="color:#1C1A19; font-size:14px; margin:24px 0 8px;">Merchant</h3>
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
    subject: `Payment received — order ${args.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Payment received</h2>
        <p style="color: #1C1A19; line-height: 1.6; margin:0 0 16px;">
          ${args.customerName ? `Hi ${escapeHtml(args.customerName)}, ` : ""}your
          PayPal payment has been received — thank you.
        </p>

        ${renderPaymentReceiptBlock(args)}

        <p style="color: #6e665d; line-height: 1.6; margin-top:24px;">
          You can follow the order status and download your documents in
          the portal.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px 0;">
          Open your portal
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
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
    subject: `Payment not completed — order ${args.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Payment not completed</h2>
        <p style="color: #1C1A19; line-height: 1.6; margin:0 0 16px;">
          ${args.customerName ? `Hi ${escapeHtml(args.customerName)}, ` : ""}your
          PayPal payment did not go through — you have not been charged.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Your order is saved and you can try again from your portal. If
          PayPal declined the payment repeatedly, check your PayPal account
          or try a different funding source.
        </p>
        ${
          args.reason
            ? `<p style="color:#6e665d; font-size:13px;">Provider status: <span style="font-family:monospace;">${escapeHtml(args.reason)}</span></p>`
            : ""
        }

        ${renderPaymentReceiptBlock({ ...args, captureId: null })}

        <a href="${args.retryUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Try again
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
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
    subject: `Your VR inquiry has been received — ${args.productLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Thank you for your inquiry</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Hello ${escapeHtml(args.contactName)},
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          We received your inquiry for <strong>${escapeHtml(args.productLabel)}</strong>.
          VR projects call for a conversation about scope, target devices and
          technical details — we will get back to you within <strong>1 working day</strong>
          to arrange a consultation.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          If you have additional files or references you would like to share
          right away, simply reply to this email.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
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
        ? `⚠ New job application (files not scanned) — ${args.fullName}`
        : `New job application — ${args.fullName} (${args.position})`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">New job application</h2>
        ${
          unscanned > 0
            ? `<div style="background: #fdecea; border: 1px solid #e5b3ab; border-radius: 8px; padding: 12px 16px; margin: 16px 0; color: #8a2c1c; line-height: 1.6;">
          <strong>⚠ ${unscanned} file(s) were not scanned</strong> because the antivirus
          service was unavailable. Check them manually (or download them in a safe
          environment) before opening.
        </div>`
            : ""
        }
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Candidate:</strong></p>
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
          <p style="margin: 0 0 8px 0;"><strong>Application:</strong></p>
          <p style="margin: 0; color: #1C1A19; line-height: 1.7;">
            <strong>Position:</strong> ${escapeHtml(args.position)}<br/>
            ${args.employmentType ? `<strong>Type:</strong> ${escapeHtml(args.employmentType)}<br/>` : ""}
            ${args.availableFrom ? `<strong>Available from:</strong> ${escapeHtml(args.availableFrom)}<br/>` : ""}
            ${args.expectedSalary ? `<strong>Expected salary:</strong> ${escapeHtml(args.expectedSalary)}<br/>` : ""}
            ${args.experienceYears ? `<strong>Experience:</strong> ${escapeHtml(args.experienceYears)}<br/>` : ""}
            ${args.education ? `<strong>Education:</strong> ${escapeHtml(args.education)}<br/>` : ""}
          </p>
        </div>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Software:</strong></p>
          <p style="margin: 0 0 12px 0; color: #1C1A19; line-height: 1.7;">${listOrDash(args.software, args.softwareOther)}</p>
          <p style="margin: 0 0 8px 0;"><strong>3D skills:</strong></p>
          <p style="margin: 0; color: #1C1A19; line-height: 1.7;">${listOrDash(args.skills, args.skillsOther)}</p>
        </div>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Cover letter:</strong></p>
          <p style="margin: 0; color: #1C1A19; white-space: pre-wrap;">${escapeHtml(args.coverLetter)}</p>
        </div>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Attachments (links valid 30 days):</strong></p>
          <ul style="margin: 0; padding-left: 18px; color: #1C1A19; line-height: 1.6;">
            ${args.fileLinks
              .map((f) =>
                f.url
                  ? `<li><a href="${escapeHtml(f.url)}">${escapeHtml(f.label)}: ${escapeHtml(f.fileName)}</a></li>`
                  : `<li>${escapeHtml(f.label)}: ${escapeHtml(f.fileName)} (link unavailable — download from storage)</li>`,
              )
              .join("")}
          </ul>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">Application ID: ${escapeHtml(args.applicationId)}</p>
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
    subject: "Your application has been received — Elegant Render",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Thank you for applying</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Hello ${escapeHtml(args.fullName)},
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          We received your application for the
          <strong>${escapeHtml(args.position)}</strong> position, along with
          your CV and portfolio. Our team reviews every application — if your
          profile matches what we are looking for, we will reach out to
          schedule a conversation.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          If you would like to add anything, you can reply directly to this
          email.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — part of White Rook DOO</p>
      </div>
    `,
  });
}
