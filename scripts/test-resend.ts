/**
 * test-resend.ts — Smoke test for the Resend transactional email setup.
 *
 * Usage: `npx tsx scripts/test-resend.ts your@email.com`
 * Sends one branded portal-access email to the given recipient using the
 * EMAIL_FROM + RESEND_API_KEY in .env.local.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { Resend } from "resend";

const recipient = process.argv[2];
if (!recipient) {
  console.error("Usage: npx tsx scripts/test-resend.ts <email>");
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM;
if (!apiKey) {
  console.error("RESEND_API_KEY is missing in .env.local");
  process.exit(1);
}
if (!from) {
  console.error("EMAIL_FROM is missing in .env.local");
  process.exit(1);
}

const resend = new Resend(apiKey);

const html = `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
    <h2 style="color: #1C1A19;">Resend smoke test</h2>
    <p style="color: #6e665d; line-height: 1.6;">
      Ako čitaš ovaj email, Resend integracija radi: API ključ je validan,
      domen je verifikovan, i šablon prolazi kroz <code>resend.emails.send()</code>.
    </p>
    <p style="color: #9ca3af; font-size: 13px;">
      Sledeći korak: testiraj guest checkout na lokalnom dev serveru i potvrdi
      da magic link iz inbox-a prijavljuje korisnika u portal.
    </p>
    <hr style="border: none; border-top: 1px solid #d8cec4; margin: 24px 0;" />
    <p style="color: #9ca3af; font-size: 12px;">Elegant Render — deo White Rook DOO</p>
  </div>
`;

async function main() {
  console.log(`→ Sending test email`);
  console.log(`  from: ${from}`);
  console.log(`  to:   ${recipient}\n`);

  const { data, error } = await resend.emails.send({
    from: from!,
    to: recipient,
    subject: "Resend smoke test — Elegant Render",
    html,
  });

  if (error) {
    console.error("✗ Send failed");
    console.error(`  ${error.name}: ${error.message}`);
    process.exit(1);
  }

  console.log("✓ Sent");
  console.log(`  message id: ${data?.id ?? "(no id)"}`);
  console.log("\nProveri inbox (i spam folder) za par sekundi.");
}

main();
