/**
 * scripts/unlink-google-account.ts — Delete the Google Account row
 * for a User by email. Keeps the User row and any other Account
 * rows intact, so isAdmin flags and existing data are preserved.
 *
 * Useful when an old OAuth Account record (e.g. from a prior
 * AUTH_GOOGLE_ID) is blocking a fresh sign-in flow. The next Google
 * sign-in will create a new Account record linked to the same User
 * (because allowDangerousEmailAccountLinking=true).
 *
 * Usage: npx tsx scripts/unlink-google-account.ts <email>
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npx tsx scripts/unlink-google-account.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });
  if (!user) {
    console.log(`No User row for ${email}. Nothing to unlink.`);
    return;
  }

  const googleAccounts = user.accounts.filter((a) => a.provider === "google");
  if (googleAccounts.length === 0) {
    console.log(`User ${email} has no Google Account rows. Nothing to do.`);
    return;
  }

  console.log(`Removing ${googleAccounts.length} Google Account row(s) for ${email}:`);
  for (const acc of googleAccounts) {
    console.log(`  - id=${acc.id}, providerAccountId=${acc.providerAccountId}`);
  }

  const result = await prisma.account.deleteMany({
    where: { userId: user.id, provider: "google" },
  });

  console.log(`\nDeleted ${result.count} Account row(s). User row preserved.`);
  console.log(`Next Google sign-in will create a fresh Account linked to ${email}.`);
}

main()
  .catch((err) => {
    console.error("Unlink failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
