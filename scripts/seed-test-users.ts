/**
 * scripts/seed-test-users.ts — Idempotently upserts three test
 * accounts for QA: regular user, admin (no finance), and admin with
 * finance permissions. Safe to re-run; password is reset on each run.
 *
 * Usage: npx tsx scripts/seed-test-users.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL!,
});
const prisma = new PrismaClient({ adapter });

const TEST_USERS = [
  {
    email: "test.user@elegantrender.rs",
    name: "Test User",
    password: "TestUser123!",
    isAdmin: false,
    canManageFinance: false,
    description: "Regular customer (klijent)",
  },
  {
    email: "test.admin@elegantrender.rs",
    name: "Test Admin",
    password: "TestAdmin123!",
    isAdmin: true,
    canManageFinance: false,
    description: "Admin without finance permissions",
  },
  {
    email: "test.finance@elegantrender.rs",
    name: "Test Finance Admin",
    password: "TestFinance123!",
    isAdmin: true,
    canManageFinance: true,
    description: "Admin with finance permissions (cenovnik + izvoz)",
  },
] as const;

async function main() {
  console.log(`\nSeeding ${TEST_USERS.length} test users...\n`);

  for (const u of TEST_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        passwordHash,
        isAdmin: u.isAdmin,
        canManageFinance: u.canManageFinance,
        emailVerified: new Date(),
      },
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        isAdmin: u.isAdmin,
        canManageFinance: u.canManageFinance,
        emailVerified: new Date(),
      },
      select: { id: true, email: true, isAdmin: true, canManageFinance: true },
    });

    console.log(`  ${u.description}`);
    console.log(`    email:    ${user.email}`);
    console.log(`    password: ${u.password}`);
    console.log(`    flags:    isAdmin=${user.isAdmin}, canManageFinance=${user.canManageFinance}`);
    console.log(`    id:       ${user.id}\n`);
  }

  console.log("Done. Sign in at /prijava with the credentials above.\n");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
