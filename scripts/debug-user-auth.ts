/**
 * scripts/debug-user-auth.ts — Inspect what Auth.js has stored for a
 * given email: User row, linked Account rows, Sessions. Useful when
 * a sign-in flow misbehaves and you want to see the DB state without
 * opening Supabase Studio.
 *
 * Usage: npx tsx scripts/debug-user-auth.ts <email>
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
    console.error("Usage: npx tsx scripts/debug-user-auth.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: true,
      sessions: { orderBy: { expires: "desc" }, take: 5 },
    },
  });

  if (!user) {
    console.log(`\nNo User row found for email: ${email}`);
    console.log(
      "  → Google OAuth would create a fresh User on first sign-in.\n",
    );
    return;
  }

  console.log(`\nUser found:`);
  console.log(`  id:               ${user.id}`);
  console.log(`  email:            ${user.email}`);
  console.log(`  name:             ${user.name ?? "(null)"}`);
  console.log(`  emailVerified:    ${user.emailVerified ?? "(null)"}`);
  console.log(`  passwordHash:     ${user.passwordHash ? "set" : "(null)"}`);
  console.log(`  isAdmin:          ${user.isAdmin}`);
  console.log(`  canManageFinance: ${user.canManageFinance}`);
  console.log(`  createdAt:        ${user.createdAt.toISOString()}`);

  console.log(`\nLinked Accounts: ${user.accounts.length}`);
  for (const acc of user.accounts) {
    console.log(
      `  - provider=${acc.provider}, providerAccountId=${acc.providerAccountId}`,
    );
    console.log(`    type=${acc.type}, scope=${acc.scope ?? "(null)"}`);
    console.log(`    accountId=${acc.id}`);
  }

  console.log(`\nRecent Sessions: ${user.sessions.length}`);
  for (const s of user.sessions) {
    const expired = s.expires < new Date() ? " [expired]" : "";
    console.log(`  - ${s.sessionToken.slice(0, 16)}…  expires=${s.expires.toISOString()}${expired}`);
  }

  console.log("");
}

main()
  .catch((err) => {
    console.error("Debug failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
