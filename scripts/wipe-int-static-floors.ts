/**
 * One-off migration: int-static OrderItems move to the new per-floor schema.
 *
 * Per user direction (wipe and start fresh):
 *   1. Delete every OrderFile attached to an int-static OrderItem (old files
 *      had no floorId — easier to re-upload under the new per-floor flow).
 *   2. Clear clientNote.
 *   3. Reset configJson to a single empty floor ({ floors: [newFloor(0)] }).
 *   4. Reset item.totalRsd to the current RSD single-floor price (single floor, no extras).
 *   5. Recompute the parent order totalRsd.
 *
 * Idempotent-ish: re-running will wipe again. Only run before the first
 * deploy of the new UI so existing clients don't lose active work.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import type { Prisma } from "../src/generated/prisma/client";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  INT_STATIC_FIRST_FLOOR_RSD,
  newFloor,
} from "../src/lib/catalog/interior-config";

const adapter = new PrismaPg(process.env.DIRECT_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const items = await prisma.orderItem.findMany({
    where: { productId: "int-static" },
    select: { id: true, orderId: true },
  });

  console.log(`Found ${items.length} int-static OrderItem(s) to migrate.`);

  const touchedOrders = new Set<string>();

  for (const item of items) {
    // Delete attached files
    const deletedFiles = await prisma.orderFile.deleteMany({
      where: { orderItemId: item.id },
    });

    const initialFloors = { floors: [newFloor(0)] };
    await prisma.orderItem.update({
      where: { id: item.id },
      data: {
        clientNote: null,
        configJson: initialFloors as unknown as Prisma.InputJsonValue,
        totalRsd: INT_STATIC_FIRST_FLOOR_RSD,
      },
    });

    console.log(
      `  ${item.id}: reset configJson, totalRsd=${INT_STATIC_FIRST_FLOOR_RSD} RSD, removed ${deletedFiles.count} file(s)`,
    );
    touchedOrders.add(item.orderId);
  }

  // Recalculate affected order totals
  for (const orderId of touchedOrders) {
    const items = await prisma.orderItem.findMany({
      where: { orderId },
      select: { totalRsd: true },
    });
    const totalRsd = items.reduce((sum, i) => sum + i.totalRsd, 0);
    await prisma.order.update({
      where: { id: orderId },
      data: { totalRsd },
    });
    console.log(`  Order ${orderId}: recalculated totalRsd=${totalRsd} RSD`);
  }

  console.log(`Done. ${items.length} items migrated, ${touchedOrders.size} orders updated.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
