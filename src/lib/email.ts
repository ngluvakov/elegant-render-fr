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

async function send(args: { to: string; subject: string; html: string }) {
  const { error } = await getResend().emails.send({
    from: FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
  });
  if (error) {
    throw new Error(`Resend: ${error.name ?? "send_failed"} — ${error.message}`);
  }
}

// ─── Email templates ─────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  token: string,
) {
  const url = `${getAuthUrl()}/verifikacija?token=${token}`;

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
  const url = `${getAuthUrl()}/nova-lozinka?token=${token}`;

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
  const url = `${getAuthUrl()}/portal-pristup?token=${token}&next=${encodeURIComponent(
    `/portal/porudzbine/${orderId}`,
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
  totalEur: number,
) {
  const portalUrl = `${getAuthUrl()}/portal`;

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
            <strong>Ukupno:</strong> €${totalEur}
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

// ─── VR consultation inquiries ───────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

export async function sendVrInquiryAdminEmail(args: {
  inquiryId: string;
  productLabel: string;
  contactName: string;
  email: string;
  phone?: string;
  message?: string;
  config: VrConfig;
}) {
  const adminUrl = `${getAuthUrl()}/portal/admin/vr-upiti`;
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
