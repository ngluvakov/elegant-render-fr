/**
 * email.ts — Resend transactional email sender for the platform.
 *
 * Exports sendVerificationEmail, sendPasswordResetEmail,
 * sendOrderConfirmationEmail, and sendPortalAccessEmail — all branded
 * HTML templates in Serbian.
 *
 * Used by: server/actions/auth, server/actions/checkout,
 *          server/actions/payment
 */
import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Elegant Render <noreply@elegantrender.rs>";

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
  const url = `${process.env.AUTH_URL}/verifikacija?token=${token}`;

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
  const url = `${process.env.AUTH_URL}/nova-lozinka?token=${token}`;

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
  const url = `${process.env.AUTH_URL}/portal-pristup?token=${token}&next=${encodeURIComponent(
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
  const portalUrl = `${process.env.AUTH_URL}/portal`;

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
