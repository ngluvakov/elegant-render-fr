/**
 * grant-finance-admin — flip canManageFinance on a user account.
 *
 * Usage:
 *   npx tsx scripts/grant-finance-admin.ts user@example.com
 *   npx tsx scripts/grant-finance-admin.ts user@example.com --revoke
 *
 * Requires the target user to already exist. Sets isAdmin=true alongside
 * the finance flag so requireFinanceAdmin (which checks both) succeeds.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DIRECT_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => !a.startsWith("--"));
  const revoke = args.includes("--revoke");

  if (!email) {
    console.error(
      "Usage: npx tsx scripts/grant-finance-admin.ts <email> [--revoke]",
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, isAdmin: true, canManageFinance: true },
  });

  if (!existing) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: revoke
      ? { canManageFinance: false }
      : { isAdmin: true, canManageFinance: true },
    select: { id: true, email: true, isAdmin: true, canManageFinance: true },
  });

  console.log(
    revoke ? "Finance admin revoked:" : "Finance admin granted:",
    updated,
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
