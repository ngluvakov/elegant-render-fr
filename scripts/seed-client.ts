import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { calculateQuote } from "../src/lib/catalog/calculate";
import { generateOrderNumber } from "../src/lib/order/generate-number";

const adapter = new PrismaPg(process.env.DIRECT_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash("Klijent2026!", 12);

  const client = await prisma.user.upsert({
    where: { email: "klijent@elegantrender.rs" },
    update: { passwordHash: hash, name: "Nikola Test" },
    create: {
      name: "Nikola Test",
      email: "klijent@elegantrender.rs",
      passwordHash: hash,
      emailVerified: new Date(),
    },
  });

  console.log("Client created:", client.id, client.email);

  // Test draft order with 3 items
  const quoteItems = [
    {
      instanceId: "seed-1",
      productId: "int-static",
      categoryId: "interior",
      addOnQuantities: {},
    },
    {
      instanceId: "seed-2",
      productId: "vs-static",
      categoryId: "staging",
      addOnQuantities: {},
    },
    {
      instanceId: "seed-3",
      productId: "fp2d-single",
      categoryId: "floorplans-2d",
      addOnQuantities: {},
    },
  ];

  const calculation = calculateQuote(quoteItems);

  const existing = await prisma.order.findFirst({
    where: { userId: client.id, status: "draft" },
  });

  if (existing) {
    console.log("Draft order already exists:", existing.orderNumber);
    await prisma.$disconnect();
    return;
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: client.id,
      projectName: "Test projekat",
      totalEur: calculation.total,
      items: {
        create: calculation.items.map((item) => ({
          productId: item.productId,
          categoryId:
            quoteItems.find((q) => q.instanceId === item.instanceId)
              ?.categoryId ?? "",
          productLabel: item.productLabel,
          categoryLabel: item.categoryLabel,
          basePriceEur: item.basePriceEur,
          totalEur: item.totalEur,
          addOnsJson: item.addOns,
        })),
      },
      statusEvents: {
        create: {
          toStatus: "draft",
          note: "Seed: test porudžbina",
        },
      },
    },
  });

  console.log("Draft order created:", order.orderNumber, "€" + order.totalEur);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
