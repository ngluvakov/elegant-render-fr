/**
 * email.ts — Resend transactional email sender for the platform.
 *
 * Exports sendVerificationEmail, sendPasswordResetEmail,
 * sendOrderConfirmationEmail, sendPortalAccessEmail, and the VR
 * inquiry pair — all branded HTML templates in Serbian.
 *
 * Used by: server/actions/auth, server/actions/checkout,
 *          server/actions/payment, server/actions/vr-inquiry
 */
import { Resend } from "resend";
import type { VrConfig } from "@/lib/catalog/vr-config";
import { IMPRINT, formatAddress } from "@/lib/content/site";

const FROM = process.env.EMAIL_FROM ?? "Elegant Render <noreply@elegantrender.rs>";
const ADMIN_NOTIFY_EMAIL =
  process.env.ADMIN_NOTIFY_EMAIL ?? "info@elegantrender.rs";

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

function formatEmailRsd(amount: number): string {
  return `${Math.round(amount).toLocaleString("sr-Latn-RS", {
    maximumFractionDigits: 0,
  })} RSD`;
}

function formatEmailMoney(cents: number, _currency: "RSD" | null = "RSD"): string {
  void _currency;
  return formatEmailRsd(cents / 100);
}

// ─── Email templates ─────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  token: string,
) {
  const url = `${getAuthUrl()}/verify-email?token=${token}`;

  await send({
    to,
    subject: "Potvrdite vašu email adresu — Elegant Render",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Dobrodošli u Elegant Render</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Kliknite na dugme ispod da potvrdite vašu email adresu i aktivirate nalog.
        </p>
        <a href="${url}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Potvrdite email
        </a>
        <p style="color: #9ca3af; font-size: 13px;">
          Ako niste vi kreirali nalog, ignorišite ovaj email.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
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
    subject: "Resetovanje lozinke — Elegant Render",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Resetovanje lozinke</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Primili smo zahtev za promenu lozinke. Kliknite na dugme ispod da
          postavite novu lozinku.
        </p>
        <a href="${url}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Postavite novu lozinku
        </a>
        <p style="color: #9ca3af; font-size: 13px;">
          Link važi 1 sat. Ako niste vi zatražili promenu lozinke, ignorišite
          ovaj email.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
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
    subject: `Pristup vašoj porudžbini ${orderNumber} — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Hvala vam na poverenju</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Vaša porudžbina <strong>${orderNumber}</strong> je primljena.
          Kliknite na dugme ispod da pristupite portalu i pratite napredak —
          nije potrebna lozinka.
        </p>
        <a href="${url}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Pristupi porudžbini
        </a>
        <p style="color: #9ca3af; font-size: 13px;">
          Link važi 7 dana. Možete ga koristiti samo jednom — nakon toga
          ćete biti prijavljeni i možete postaviti lozinku u portalu.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  orderNumber: string,
  totalRsd: number,
  amountLabel?: string,
) {
  const portalUrl = `${getAuthUrl()}/portal`;
  const totalLabel = amountLabel ?? formatEmailRsd(totalRsd);

  await send({
    to,
    subject: `Potvrda porudžbine ${orderNumber} — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Porudžbina primljena</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Vaša porudžbina <strong>${orderNumber}</strong> je uspešno primljena i plaćena.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; font-size: 14px;">
            <strong>Broj porudžbine:</strong> ${orderNumber}<br/>
            <strong>Ukupno:</strong> ${escapeHtml(totalLabel)}
          </p>
        </div>
        <p style="color: #6e665d; line-height: 1.6;">
          Možete pratiti status vaše porudžbine u portalu.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Otvorite portal
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
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
  totalRsd: number;
  amountLabel?: string;
  pdfBuffer: Buffer;
}) {
  const portalUrl = `${getAuthUrl()}/portal`;
  const filename = `racun-${args.invoiceNumber}.pdf`;
  const amountLabel = args.amountLabel ?? formatEmailRsd(args.totalRsd);

  await send({
    to: args.to,
    subject: `Račun ${args.invoiceNumber} — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Vaš račun</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          U prilogu je račun broj <strong>${escapeHtml(args.invoiceNumber)}</strong> za porudžbinu koju ste upravo platili.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; font-size: 14px;">
            <strong>Broj računa:</strong> ${escapeHtml(args.invoiceNumber)}<br/>
            <strong>Iznos:</strong> ${escapeHtml(amountLabel)}
          </p>
        </div>
        <p style="color: #6e665d; line-height: 1.6;">
          Status porudžbine i preuzete materijale pratite u portalu.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Otvorite portal
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
      </div>
    `,
    attachments: [{ filename, content: args.pdfBuffer }],
  });
}

/**
 * Predračun (proforma) notification with the rendered PDF as an
 * attachment + bank instructions in the body. Triggered from the
 * proforma_issued_email outbox handler after issueProforma() finishes.
 */
export async function sendProformaIssuedEmail(args: {
  to: string;
  proformaNumber: string;
  totalRsd: number;
  amountLabel?: string;
  dueDate: Date;
  pdfBuffer: Buffer;
}) {
  const filename = `predracun-${args.proformaNumber}.pdf`;
  const dueDateLabel = args.dueDate.toLocaleDateString("sr-Latn-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const amountLabel = args.amountLabel ?? formatEmailRsd(args.totalRsd);

  await send({
    to: args.to,
    subject: `Predračun ${args.proformaNumber} — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Predračun za uplatu</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          U prilogu je predračun broj <strong>${escapeHtml(args.proformaNumber)}</strong>.
          Po prijemu uplate izdaćemo konačni račun (faktura) i započeti rad.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; font-size: 14px;">
            <strong>Broj predračuna:</strong> ${escapeHtml(args.proformaNumber)}<br/>
            <strong>Iznos:</strong> ${escapeHtml(amountLabel)}<br/>
            <strong>Rok plaćanja:</strong> ${dueDateLabel}
          </p>
        </div>
        <p style="color: #6e665d; line-height: 1.6;">
          Detaljne instrukcije za uplatu (IBAN, poziv na broj) nalaze se u priloženom PDF dokumentu.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
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
  const greeting = args.contactName ? `, ${args.contactName}` : "";
  const subjectLine = args.inquirySubject
    ? `o vašem upitu „${args.inquirySubject}”`
    : "o vašem upitu";

  await send({
    to: args.to,
    subject: "Pregledali smo vaš upit — uskoro stiže predračun",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Pozdrav${escapeHtml(greeting)},</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Hvala vam što ste se javili. Pregledali smo poruku ${escapeHtml(subjectLine)}
          i pripremamo predračun (proforma) sa instrukcijama za uplatu na žiro-račun.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Predračun ćete dobiti zasebnim e-mailom u toku narednog radnog dana, sa
          PDF dokumentom i tačnim podacima za uplatu (IBAN, poziv na broj).
          Po prijemu uplate izdajemo konačnu fakturu i započinjemo rad.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Ukoliko imate dodatna pitanja u međuvremenu, slobodno odgovorite na
          ovaj e-mail — javljamo se isti dan.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
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
  const dateLabel = args.expiresAt.toLocaleDateString("sr-RS");

  await send({
    to: args.to,
    subject: `AI krediti ističu za ${args.daysLeft} dana — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">AI krediti ističu uskoro</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Vaš aktivni AI Studio balans je <strong>${escapeHtml(args.creditsLabel)}</strong>
          i važi do <strong>${escapeHtml(dateLabel)}</strong>.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Nova dopuna produžava rok važenja celog aktivnog balansa na narednih 12 meseci.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Dopuni kredite
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
      </div>
    `,
  });
}

function configToBullets(config: VrConfig): string {
  const items: string[] = [];
  items.push(`<strong>Projekat:</strong> ${escapeHtml(config.projectName)}`);
  items.push(`<strong>Tip iskustva:</strong> ${config.experienceType}`);
  items.push(`<strong>Target uređaj:</strong> ${config.targetDevice}`);
  if (config.locomotion)
    items.push(`<strong>Locomotion:</strong> ${config.locomotion}`);
  if (config.dayNightMode)
    items.push(`<strong>Day/Night:</strong> ${config.dayNightMode}`);
  const interactions: string[] = [];
  if (config.doorInteraction) interactions.push("vrata");
  if (config.lightsInteraction) interactions.push("svetla");
  if (config.materialsInteraction) interactions.push("materijali");
  if (interactions.length > 0) {
    items.push(`<strong>Interakcije:</strong> ${interactions.join(", ")}`);
  }
  if (config.extraFloorsCount > 0)
    items.push(`<strong>Dodatni spratovi:</strong> ${config.extraFloorsCount}`);
  if (config.interactiveTypeCount > 0)
    items.push(
      `<strong>Interaktivni tipovi (broj):</strong> ${config.interactiveTypeCount}`,
    );
  if (config.brandingEnabled) items.push(`<strong>Brending:</strong> da`);
  if (config.description) {
    items.push(
      `<strong>Opis:</strong><br/>${escapeHtml(config.description).replace(/\n/g, "<br/>")}`,
    );
  }
  if (config.customInteractionDescription) {
    items.push(
      `<strong>Custom interakcije:</strong><br/>${escapeHtml(config.customInteractionDescription).replace(/\n/g, "<br/>")}`,
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
  // Broj fajlova koji NIJE skeniran (skener bio nedostupan). > 0 znači
  // da fajlove treba proveriti ručno pre otvaranja.
  unscannedFileCount?: number;
}) {
  const unscanned = args.unscannedFileCount ?? 0;
  await send({
    to: ADMIN_NOTIFY_EMAIL,
    subject:
      unscanned > 0
        ? `⚠ Novi upit (fajlovi neskenirani) — ${args.contactName}`
        : `Novi upit za procenu — ${args.contactName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Novi upit za procenu</h2>
        ${
          unscanned > 0
            ? `<div style="background: #fdecea; border: 1px solid #e5b3ab; border-radius: 8px; padding: 12px 16px; margin: 16px 0; color: #8a2c1c; line-height: 1.6;">
          <strong>⚠ ${unscanned} fajl(ova) nije skenirano</strong> jer antivirus servis
          nije bio dostupan. Fajlovi su zadržani u karantinu — proverite ih ručno
          (ili preuzmite u sigurnom okruženju) pre otvaranja. Upit je ipak sačuvan
          da se lead ne bi izgubio.
        </div>`
            : ""
        }
        <p style="color: #6e665d; line-height: 1.6;">
          ${escapeHtml(args.contactName)} je poslao/la kratak brief i očekuje
          predlog usluga sa cenom.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Kontakt:</strong></p>
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
            ${args.serviceType ? `<strong>Usluga:</strong> ${escapeHtml(args.serviceType)}<br/>` : ""}
            ${args.budget ? `<strong>Budžet:</strong> ${escapeHtml(args.budget)}<br/>` : ""}
            ${args.deadline ? `<strong>Rok:</strong> ${escapeHtml(args.deadline)}<br/>` : ""}
            ${args.sourceLabel ? `<strong>Izvor:</strong> ${escapeHtml(args.sourceLabel)}<br/>` : ""}
            <strong>Fajlovi:</strong> ${args.fileCount}
          </p>
        </div>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Poruka klijenta:</strong></p>
          <p style="margin: 0; color: #1C1A19; white-space: pre-wrap;">${escapeHtml(args.message)}</p>
        </div>
        <a href="${args.adminUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Otvori upit u admin panelu
        </a>
        <p style="color: #9ca3af; font-size: 12px;">Upit ID: ${escapeHtml(args.inquiryId)}</p>
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
    subject: "Vaš upit je primljen — Elegant Render",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Hvala na upitu</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Zdravo ${escapeHtml(args.contactName)},
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Primili smo vaš opis projekta. Pregledaćemo materijale i javiti se
          sa predlogom usluga i okvirnom cenom, obično u roku od
          <strong>1 radnog dana</strong>.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Ako želite da dodate još referenci, možete odgovoriti direktno na
          ovaj email.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
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
  const dateLabel = args.expiresAt.toLocaleDateString("sr-RS");

  await send({
    to: args.to,
    subject: `Dobili ste ${args.grantedLabel} AI kredita — Elegant Render`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Dodali smo vam AI kredite</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Naš tim vam je dodelio <strong>${escapeHtml(args.grantedLabel)}</strong>.
          Vaš novi aktivni balans je <strong>${escapeHtml(args.balanceLabel)}</strong>
          i važi do <strong>${escapeHtml(dateLabel)}</strong>.
        </p>
        ${
          args.note
            ? `<div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; line-height: 1.6;"><em>${escapeHtml(args.note)}</em></p>
        </div>`
            : ""
        }
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Otvori AI Studio
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
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
    subject: `Odobrena besplatna izmena — porudžbina ${args.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Vaša izmena je odobrena</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Naš tim je odobrio besplatnu izmenu na porudžbini
          <strong>${escapeHtml(args.orderNumber)}</strong>.
          Krećemo sa radom — bićete obavešteni kada bude spremno za pregled.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; line-height: 1.6;"><em>${escapeHtml(args.note)}</em></p>
        </div>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Otvori porudžbinu
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
      </div>
    `,
  });
}

export async function sendAdditionalChargeRequestedEmail(args: {
  to: string;
  orderNumber: string;
  orderId: string;
  totalCents: number;
  billingCurrency?: "RSD" | null;
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
  const totalRsd = args.totalCents / 100;
  const totalLabel =
    args.billingCurrency && args.billingTotalCents != null
      ? formatEmailMoney(args.billingTotalCents, args.billingCurrency)
      : formatEmailRsd(totalRsd);
  const linesHtml = args.lines
    .map((line) => {
      const subtotal = (line.amountCents * line.quantity) / 100;
      const subtotalLabel =
        args.billingCurrency && line.billingSubtotalCents != null
          ? formatEmailMoney(line.billingSubtotalCents, args.billingCurrency)
          : formatEmailRsd(subtotal);
      return `<li>
        ${escapeHtml(line.label)}
        ${line.quantity > 1 ? ` × ${line.quantity}` : ""}
        — <strong>${escapeHtml(subtotalLabel)}</strong>
      </li>`;
    })
    .join("\n");

  await send({
    to: args.to,
    subject: `Dodatna naplata na porudžbini ${args.orderNumber} — ${totalLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Dodatna naplata</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Na porudžbini <strong>${escapeHtml(args.orderNumber)}</strong> je
          formirana dodatna naplata za stavke van prvobitnog dogovora.
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
          <strong>Ukupno za naplatu: ${escapeHtml(totalLabel)}</strong>
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Otvorite porudžbinu u portalu da pregledate stavke i izvršite plaćanje.
          Dostupne su sve opcije plaćanja kao i kod prvobitne porudžbine.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Otvori porudžbinu i plati
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
      </div>
    `,
  });
}

export async function sendAdditionalChargePaidEmail(args: {
  to: string;
  orderNumber: string;
  orderId: string;
  totalCents: number;
  billingCurrency?: "RSD" | null;
  billingTotalCents?: number | null;
}) {
  const portalUrl = `${getAuthUrl()}/portal/orders/${args.orderId}`;
  const totalRsd = args.totalCents / 100;
  const totalLabel =
    args.billingCurrency && args.billingTotalCents != null
      ? formatEmailMoney(args.billingTotalCents, args.billingCurrency)
      : formatEmailRsd(totalRsd);

  await send({
    to: args.to,
    subject: `Dodatna naplata plaćena — porudžbina ${args.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Plaćanje primljeno</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Hvala. Vaše plaćanje za dodatnu naplatu na porudžbini
          <strong>${escapeHtml(args.orderNumber)}</strong> je uspešno primljeno.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19;">
            <strong>Iznos:</strong> ${escapeHtml(totalLabel)}
          </p>
        </div>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Otvori porudžbinu
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
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
    subject: `Novi VR upit — ${args.contactName} (${args.productLabel})`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Novi VR upit</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          ${escapeHtml(args.contactName)} je popunio konsultacioni intake za
          <strong>${escapeHtml(args.productLabel)}</strong>.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Kontakt:</strong></p>
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
          <p style="margin: 0 0 8px 0;"><strong>Poruka klijenta:</strong></p>
          <p style="margin: 0; color: #1C1A19; white-space: pre-wrap;">${escapeHtml(args.message)}</p>
        </div>`
            : ""
        }
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Konfiguracija:</strong></p>
          <ul style="margin: 0; padding-left: 18px; color: #1C1A19; line-height: 1.6;">
            ${configToBullets(args.config)}
          </ul>
        </div>
        <a href="${adminUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Otvori upit u admin panelu
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
  priceRsd: number;
  orderNumber: string;
  orderId: string;
  token: string;
}) {
  const url = `${getAuthUrl()}/portal-access?token=${args.token}&next=${encodeURIComponent(
    `/portal/orders/${args.orderId}`,
  )}`;
  await send({
    to: args.to,
    subject: `Vaš VR projekat je spreman za plaćanje — ${args.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Dogovor zaključen</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Zdravo ${escapeHtml(args.contactName)},
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Hvala na razgovoru — definisali smo opseg projekta i pripremili
          porudžbinu za plaćanje.
        </p>
        <div style="background: #f6f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1C1A19; line-height: 1.7;">
            <strong>Projekat:</strong> ${escapeHtml(args.projectName)}<br/>
            <strong>Usluga:</strong> ${escapeHtml(args.productLabel)}<br/>
            <strong>Broj porudžbine:</strong> ${escapeHtml(args.orderNumber)}<br/>
            <strong>Iznos:</strong> ${formatEmailRsd(args.priceRsd)}
          </p>
        </div>
        <p style="color: #6e665d; line-height: 1.6;">
          Kliknite na dugme ispod da otvorite porudžbinu i dovršite plaćanje.
          Link vas direktno prijavljuje u portal — nije potrebna lozinka.
        </p>
        <a href="${url}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Otvori i plati
        </a>
        <p style="color: #9ca3af; font-size: 13px;">
          Link važi 7 dana. Možete ga koristiti samo jednom — nakon toga
          ćete biti prijavljeni i možete postaviti lozinku u portalu.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
      </div>
    `,
  });
}

// ─── Nestpay (Banca Intesa) — payment success / failure ──
//
// Per EPM standard 2.7 the merchant must email the customer the
// payment outcome with five mandatory blocks: outcome statement,
// customer info, order details (line items + PDV breakdown), merchant
// info, and the bank's transaction parameters (oid, AuthCode, TransId,
// Response, ProcReturnCode, mdStatus, EXTRA.TRXDATE, plus timestamp).
// All customer-facing amounts are RSD gross amounts.

export type NestpayEmailLineItem = {
  label: string;
  quantity: number;
  unitPriceLabel: string;
  totalLabel: string;
};

export type NestpayEmailTransaction = {
  oid: string;
  authCode: string;
  transId: string;
  response: string;
  procReturnCode: string;
  mdStatus: string;
  trxDate: Date | null;
};

export type NestpayEmailCustomer = {
  name: string | null;
  email: string;
  address: string | null;
};

export type NestpayEmailConversion = null;

export type NestpayEmailTotals = {
  totalLabel: string;
  vatBreakdownLabel: string | null;
  installmentCount?: number | null;
};

function renderTransactionBlock(tx: NestpayEmailTransaction): string {
  const rows = [
    ["Broj narudžbine (order ID)", tx.oid],
    ["Autorizacioni kod (AuthCode)", tx.authCode || "—"],
    ["Identifikator transakcije (TransId)", tx.transId || "—"],
    ["Status transakcije (Response)", tx.response || "—"],
    ["Kod statusa (ProcReturnCode)", tx.procReturnCode || "—"],
    ["Statusni kod 3D transakcije (mdStatus)", tx.mdStatus || "—"],
    [
      "Datum transakcije (EXTRA.TRXDATE)",
      tx.trxDate
        ? tx.trxDate.toLocaleString("sr-Latn-RS", { hour12: false })
        : "—",
    ],
  ];
  return `
    <table style="width:100%; font-size:13px; color:#1C1A19; border-collapse:collapse;">
      ${rows
        .map(
          ([k, v]) => `
            <tr>
              <td style="padding:4px 8px 4px 0; color:#6e665d; vertical-align:top;">${escapeHtml(k)}</td>
              <td style="padding:4px 0; font-family: monospace; word-break:break-all;">${escapeHtml(v)}</td>
            </tr>`,
        )
        .join("")}
    </table>
  `;
}

function renderLineItemsTable(items: NestpayEmailLineItem[]): string {
  if (!items.length) return "";
  return `
    <table style="width:100%; font-size:13px; color:#1C1A19; border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid #d8cec4;">
          <th align="left" style="padding:6px 6px 6px 0; font-weight:600;">Stavka</th>
          <th align="right" style="padding:6px; font-weight:600;">Količina</th>
          <th align="right" style="padding:6px; font-weight:600;">Jed. cena</th>
          <th align="right" style="padding:6px 0 6px 6px; font-weight:600;">Ukupno</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (line) => `
              <tr style="border-bottom:1px solid #f0e8de;">
                <td style="padding:6px 6px 6px 0;">${escapeHtml(line.label)}</td>
                <td align="right" style="padding:6px;">${line.quantity}</td>
                <td align="right" style="padding:6px;">${escapeHtml(line.unitPriceLabel)}</td>
                <td align="right" style="padding:6px 0 6px 6px;">${escapeHtml(line.totalLabel)}</td>
              </tr>`,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderMerchantBlock(): string {
  return `
    <p style="margin:0; color:#1C1A19; line-height:1.6; font-size:13px;">
      <strong>${escapeHtml(IMPRINT.shortName)}</strong><br/>
      ${escapeHtml(IMPRINT.legalName)}<br/>
      PIB ${escapeHtml(IMPRINT.taxId)} · MB ${escapeHtml(IMPRINT.registryNumber)}<br/>
      ${escapeHtml(formatAddress())}<br/>
      ${escapeHtml(IMPRINT.email)}
    </p>
  `;
}

function renderCustomerBlock(customer: NestpayEmailCustomer): string {
  return `
    <p style="margin:0; color:#1C1A19; line-height:1.6; font-size:13px;">
      ${customer.name ? `<strong>${escapeHtml(customer.name)}</strong><br/>` : ""}
      ${escapeHtml(customer.email)}<br/>
      ${customer.address ? escapeHtml(customer.address) : ""}
    </p>
  `;
}

function renderConversionBlock(_conv: NestpayEmailConversion): string {
  void _conv;
  return "";
}

function renderTotalsBlock(totals: NestpayEmailTotals): string {
  return `
    <p style="margin:8px 0 0; color:#1C1A19; font-size:14px;">
      ${
        totals.vatBreakdownLabel
          ? `<span style="color:#6e665d; font-size:13px;">${escapeHtml(totals.vatBreakdownLabel)}</span><br/>`
          : ""
      }
      <strong>Ukupno za naplatu: ${escapeHtml(totals.totalLabel)}</strong>
      ${
        totals.installmentCount && totals.installmentCount > 1
          ? `<br/><span style="color:#6e665d; font-size:13px;">Broj rata: ${totals.installmentCount}</span>`
          : ""
      }
    </p>
  `;
}

export async function sendPaymentSuccessEmail(args: {
  to: string;
  orderNumber: string;
  customer: NestpayEmailCustomer;
  lineItems: NestpayEmailLineItem[];
  totals: NestpayEmailTotals;
  conversion: NestpayEmailConversion;
  transaction: NestpayEmailTransaction;
}) {
  const portalUrl = `${getAuthUrl()}/portal`;

  await send({
    to: args.to,
    subject: `Elegant Render: vaša porudžbina je primljena — ${args.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Plaćanje uspešno</h2>
        <p style="color: #1C1A19; line-height: 1.6; font-weight:600; margin:0 0 16px;">
          Uspešno ste izvršili plaćanje — račun Vaše platne kartice je zadužen.
        </p>

        <h3 style="color:#1C1A19; font-size:14px; margin:24px 0 8px;">Podaci o porudžbini</h3>
        <p style="margin:0 0 8px; color:#1C1A19; font-size:13px;">
          <strong>Broj porudžbine:</strong> ${escapeHtml(args.orderNumber)}
        </p>
        ${renderLineItemsTable(args.lineItems)}
        ${renderTotalsBlock(args.totals)}
        ${renderConversionBlock(args.conversion)}

        <h3 style="color:#1C1A19; font-size:14px; margin:24px 0 8px;">Podaci o kupcu</h3>
        ${renderCustomerBlock(args.customer)}

        <h3 style="color:#1C1A19; font-size:14px; margin:24px 0 8px;">Podaci o trgovcu</h3>
        ${renderMerchantBlock()}

        <h3 style="color:#1C1A19; font-size:14px; margin:24px 0 8px;">Podaci o transakciji</h3>
        ${renderTransactionBlock(args.transaction)}

        <p style="color: #6e665d; line-height: 1.6; margin-top:24px;">
          Status porudžbine i dokumenta možete pratiti u portalu.
        </p>
        <a href="${portalUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px 0;">
          Otvorite portal
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
      </div>
    `,
  });
}

export async function sendPaymentFailureEmail(args: {
  to: string;
  orderNumber: string;
  customer: NestpayEmailCustomer;
  lineItems: NestpayEmailLineItem[];
  totals: NestpayEmailTotals;
  conversion: NestpayEmailConversion;
  transaction: NestpayEmailTransaction;
  retryUrl: string;
}) {
  await send({
    to: args.to,
    subject: `Plaćanje neuspešno — porudžbina ${args.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Plaćanje neuspešno</h2>
        <p style="color: #1C1A19; line-height: 1.6; font-weight:600; margin:0 0 16px;">
          Plaćanje neuspešno — račun Vaše platne kartice nije zadužen.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Vaša porudžbina je sačuvana i možete pokušati ponovo iz portala.
          Najčešći uzrok je pogrešno unet broj kartice, datum isteka ili
          sigurnosni kod. U slučaju uzastopnih grešaka, pozovite Vašu banku.
        </p>

        <h3 style="color:#1C1A19; font-size:14px; margin:24px 0 8px;">Podaci o porudžbini</h3>
        <p style="margin:0 0 8px; color:#1C1A19; font-size:13px;">
          <strong>Broj porudžbine:</strong> ${escapeHtml(args.orderNumber)}
        </p>
        ${renderLineItemsTable(args.lineItems)}
        ${renderTotalsBlock(args.totals)}
        ${renderConversionBlock(args.conversion)}

        <h3 style="color:#1C1A19; font-size:14px; margin:24px 0 8px;">Podaci o kupcu</h3>
        ${renderCustomerBlock(args.customer)}

        <h3 style="color:#1C1A19; font-size:14px; margin:24px 0 8px;">Podaci o trgovcu</h3>
        ${renderMerchantBlock()}

        <h3 style="color:#1C1A19; font-size:14px; margin:24px 0 8px;">Podaci o transakciji</h3>
        ${renderTransactionBlock(args.transaction)}

        <a href="${args.retryUrl}" style="display: inline-block; background: #B88363; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Pokušajte ponovo
        </a>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
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
    subject: `Vaš VR upit je primljen — ${args.productLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1C1A19;">Hvala na upitu</h2>
        <p style="color: #6e665d; line-height: 1.6;">
          Zdravo ${escapeHtml(args.contactName)},
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Primili smo vaš upit za <strong>${escapeHtml(args.productLabel)}</strong>.
          VR projekti zahtevaju razgovor o opsegu, target uređajima i
          tehničkim detaljima — javićemo vam se u roku od <strong>1 radnog dana</strong>
          da dogovorimo termin za konsultaciju.
        </p>
        <p style="color: #6e665d; line-height: 1.6;">
          Ako imate dodatne fajlove ili reference koje biste odmah da podelite,
          slobodno odgovorite na ovaj email.
        </p>
        <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
      </div>
    `,
  });
}
