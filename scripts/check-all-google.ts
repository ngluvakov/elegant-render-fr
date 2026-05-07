import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

(async () => {
  const allGoogleAccounts = await prisma.account.findMany({
    where: { provider: "google" },
    include: { user: { select: { email: true, name: true } } },
  });
  console.log("All Google Account rows in DB:", allGoogleAccounts.length);
  for (const a of allGoogleAccounts) {
    console.log(
      `  ${a.user.email} (${a.user.name}) → providerAccountId=${a.providerAccountId}, accountId=${a.id}`,
    );
  }

  // Also check for any users with passwordHash null AND no accounts
  // — they should not be able to log in at all.
  const orphans = await prisma.user.findMany({
    where: { passwordHash: null, accounts: { none: {} } },
    select: { id: true, email: true, createdAt: true },
  });
  console.log("\nUsers with no auth method (no password, no OAuth):", orphans.length);
  for (const u of orphans) {
    console.log(`  ${u.email} (created ${u.createdAt.toISOString()})`);
  }

  await prisma.$disconnect();
})();
