/**
 * scripts/create-bojan-account.ts — One-off: creates a user account
 * for Bojan Sučević (Studio 33) with a generated password and grants
 * 50 AI credits with the standard expiry. Skips outbox email to avoid
 * spamming Resend; password is printed to stdout for hand-off.
 *
 * Usage: npx tsx scripts/create-bojan-account.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AI_CREDIT_UNITS_PER_CREDIT,
  AI_CREDIT_EXPIRES_AFTER_MONTHS,
  formatCreditsFromUnits,
} from "../src/lib/ai-studio/catalog";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

const EMAIL = "bojan.sucevic@studio33.rs";
const NAME = "Bojan Sučević";
const CREDITS = 50;

function generatePassword(): string {
  // 12 chars base62 (no ambiguous chars) + a fixed symbol & digit anchor so
  // it always satisfies common password policies.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return `${out}!7`;
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existing) {
    throw new Error(
      `User already exists: ${EMAIL} (id=${existing.id}). Refusing to overwrite.`,
    );
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);
  const units = CREDITS * AI_CREDIT_UNITS_PER_CREDIT;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + AI_CREDIT_EXPIRES_AFTER_MONTHS);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: EMAIL,
        name: NAME,
        passwordHash,
        emailVerified: new Date(),
        aiCreditBalanceUnits: units,
        aiCreditsExpireAt: expiresAt,
      },
      select: { id: true, email: true, aiCreditBalanceUnits: true },
    });

    await tx.aiCreditTransaction.create({
      data: {
        userId: user.id,
        type: "adjustment",
        units,
        balanceAfterUnits: user.aiCreditBalanceUnits,
        note: "Initial QA grant via scripts/create-bojan-account.ts",
      },
    });

    return user;
  });

  console.log("\n=== Account created ===");
  console.log(`  name:     ${NAME}`);
  console.log(`  email:    ${result.email}`);
  console.log(`  password: ${password}`);
  console.log(`  id:       ${result.id}`);
  console.log(
    `  credits:  ${CREDITS} (${result.aiCreditBalanceUnits} units, ${formatCreditsFromUnits(result.aiCreditBalanceUnits)})`,
  );
  console.log(`  expires:  ${expiresAt.toISOString()}\n`);
}

main()
  .catch((err) => {
    console.error("Create failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
