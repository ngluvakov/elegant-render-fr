/**
 * scripts/grant-test-credits.ts — Grants AI credits to a test user.
 * Mirrors the admin grant path (balance + transaction row + expiry),
 * but skips the outbox email so QA doesn't spam Resend.
 *
 * Usage: npx tsx scripts/grant-test-credits.ts [email] [credits]
 *   defaults: test.user@elegantrender.rs, 100 credits
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AI_CREDIT_UNITS_PER_CREDIT,
  AI_CREDIT_EXPIRES_AFTER_MONTHS,
  formatCreditsFromUnits,
} from "../src/lib/ai-studio/catalog";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

const email = process.argv[2] ?? "test.user@elegantrender.rs";
const credits = Number(process.argv[3] ?? 100);

async function main() {
  if (!Number.isFinite(credits) || credits <= 0) {
    throw new Error(`Invalid credits arg: ${process.argv[3]}`);
  }
  const units = credits * AI_CREDIT_UNITS_PER_CREDIT;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + AI_CREDIT_EXPIRES_AFTER_MONTHS);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { email },
      data: {
        aiCreditBalanceUnits: { increment: units },
        aiCreditsExpireAt: expiresAt,
        aiCreditsReminder30SentAt: null,
        aiCreditsReminder7SentAt: null,
      },
      select: { id: true, email: true, aiCreditBalanceUnits: true },
    });

    await tx.aiCreditTransaction.create({
      data: {
        userId: user.id,
        type: "adjustment",
        units,
        balanceAfterUnits: user.aiCreditBalanceUnits,
        note: "QA grant via scripts/grant-test-credits.ts",
      },
    });

    return user;
  });

  console.log(`\nGranted ${credits} credits (${units} units) to ${result.email}`);
  console.log(`  new balance: ${result.aiCreditBalanceUnits} units (${formatCreditsFromUnits(result.aiCreditBalanceUnits)})`);
  console.log(`  expires:     ${expiresAt.toISOString()}\n`);
}

main()
  .catch((err) => {
    console.error("Grant failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
