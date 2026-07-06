import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DIRECT_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@elegantrender.com" },
    update: { isAdmin: true, canManageFinance: true, passwordHash: hash },
    create: {
      name: "Admin",
      email: "admin@elegantrender.com",
      passwordHash: hash,
      isAdmin: true,
      canManageFinance: true,
      emailVerified: new Date(),
    },
  });

  console.log("Admin created:", admin.id, admin.email);
  await prisma.$disconnect();
}

main();
