/**
 * email.ts — Nodemailer transactional email sender for the platform.
 *
 * Exports sendVerificationEmail, sendPasswordResetEmail, and
 * sendOrderConfirmationEmail — all branded HTML templates in Serbian.
 *
 * Used by: server/actions/auth, server/actions/checkout,
 *          server/actions/payment
 */
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM ?? "Elegant Render <noreply@elegantrender.rs>";

// ─── Email templates ─────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  token: string,
) {
  const url = `${process.env.AUTH_URL}/verifikacija?token=${token}`;

  await transporter.sendMail({
    from: FROM,
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

  await transporter.sendMail({
    from: FROM,
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

export async function sendOrderConfirmationEmail(
  to: string,
  orderNumber: string,
  totalEur: number,
) {
  const portalUrl = `${process.env.AUTH_URL}/portal`;

  await transporter.sendMail({
    from: FROM,
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
