/**
 * scripts/reassign-google-account.ts — Move a Google Account row
 * from one User to another. Used to recover from the Auth.js v5
 * "link to current session" gotcha where a logged-in user clicking
 * "Sign in with Google" attaches their Google account to whatever
 * User they were already authenticated as, instead of matching by
 * email.
 *
 * Usage: npx tsx scripts/reassign-google-account.ts <fromEmail> <toEmail>
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const fromEmail = process.argv[2]?.trim().toLowerCase();
  const toEmail = process.argv[3]?.trim().toLowerCase();
  if (!fromEmail || !toEmail) {
    console.error(
      "Usage: npx tsx scripts/reassign-google-account.ts <fromEmail> <toEmail>",
    );
    process.exit(1);
  }

  const [fromUser, toUser] = await Promise.all([
    prisma.user.findUnique({
      where: { email: fromEmail },
      include: { accounts: { where: { provider: "google" } } },
    }),
    prisma.user.findUnique({ where: { email: toEmail } }),
  ]);

  if (!fromUser) {
    console.error(`Source user not found: ${fromEmail}`);
    process.exit(1);
  }
  if (!toUser) {
    console.error(`Target user not found: ${toEmail}`);
    process.exit(1);
  }
  if (fromUser.accounts.length === 0) {
    console.error(`No Google Account row on ${fromEmail}.`);
    process.exit(1);
  }
  if (fromUser.accounts.length > 1) {
    console.error(
      `Multiple Google Accounts on ${fromEmail} (${fromUser.accounts.length}). Resolve manually.`,
    );
    process.exit(1);
  }

  const account = fromUser.accounts[0];
  console.log(`Moving Google Account:`);
  console.log(`  providerAccountId: ${account.providerAccountId}`);
  console.log(`  from User:         ${fromUser.email} (${fromUser.id})`);
  console.log(`  to   User:         ${toUser.email} (${toUser.id})`);

  await prisma.account.update({
    where: { id: account.id },
    data: { userId: toUser.id },
  });

  console.log(`\nAccount reassigned. Existing JWT sessions for ${fromEmail} may`);
  console.log(`still be valid until they expire — sign out from the app to clear.`);
}

main()
  .catch((err) => {
    console.error("Reassign failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
