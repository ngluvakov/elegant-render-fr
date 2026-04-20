/**
 * One-off migration:
 *   1. Rename every OrderItem (productId='int-static') productLabel from
 *      "Statički enterijer (po spratu)" → "Render enterijera (statički)".
 *   2. For OrderItems on draft orders, clear configJson.rooms so the new
 *      empty-by-default configurator shows zero rooms instead of stale
 *      auto-generated defaults.
 *
 * Safe to re-run — both updates are idempotent.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import type { Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DIRECT_URL!);
const prisma = new PrismaClient({ adapter });

const NEW_LABEL = "Render enterijera (statički)";

async function main() {
  const labelUpdate = await prisma.orderItem.updateMany({
    where: {
      productId: "int-static",
      productLabel: { not: NEW_LABEL },
    },
    data: { productLabel: NEW_LABEL },
  });
  console.log(`Renamed productLabel on ${labelUpdate.count} OrderItem(s).`);

  // Clear rooms on int-static items of draft orders
  const draftItems = await prisma.orderItem.findMany({
    where: {
      productId: "int-static",
      order: { status: "draft" },
    },
    select: { id: true, configJson: true },
  });

  let cleared = 0;
  for (const item of draftItems) {
    const cfg = (item.configJson ?? {}) as Record<string, unknown>;
    if (!("rooms" in cfg)) continue;
    const { rooms: _rooms, ...rest } = cfg;
    void _rooms;
    await prisma.orderItem.update({
      where: { id: item.id },
      data: { configJson: rest as Prisma.InputJsonValue },
    });
    cleared++;
  }
  console.log(`Cleared rooms on ${cleared} draft OrderItem(s).`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
