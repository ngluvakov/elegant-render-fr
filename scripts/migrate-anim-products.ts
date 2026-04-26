/**
 * One-off migration:
 *   anim-scratch / anim-existing / anim-active → consolidated `anim`
 *   product with `sourceMode` stored in configJson.
 *
 * Run with `--apply` to perform the update; without it the script prints
 * what it would do (count + sample) and exits.
 *
 * Idempotent: re-running on already-migrated rows is a no-op (the WHERE
 * clause only matches old productIds).
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import type { Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DIRECT_URL!);
const prisma = new PrismaClient({ adapter });

const OLD_TO_MODE: Record<string, "scratch" | "existing" | "active"> = {
  "anim-scratch": "scratch",
  "anim-existing": "existing",
  "anim-active": "active",
};

const NEW_PRODUCT_ID = "anim";
const NEW_PRODUCT_LABEL = "3D animacija";
const NEW_CATEGORY_LABEL = "3D animacija";

async function main() {
  const apply = process.argv.includes("--apply");
  const oldIds = Object.keys(OLD_TO_MODE);

  const items = await prisma.orderItem.findMany({
    where: { productId: { in: oldIds } },
    select: {
      id: true,
      productId: true,
      productLabel: true,
      configJson: true,
      addOnsJson: true,
      orderId: true,
    },
  });

  console.log(`Found ${items.length} OrderItem(s) to migrate.`);
  if (items.length === 0) {
    await prisma.$disconnect();
    return;
  }

  // Sample preview
  for (const it of items.slice(0, 5)) {
    const newMode = OLD_TO_MODE[it.productId];
    console.log(
      `  • ${it.id} (order ${it.orderId}): ${it.productId} → ${NEW_PRODUCT_ID} sourceMode=${newMode}`,
    );
  }
  if (items.length > 5) {
    console.log(`  • …and ${items.length - 5} more.`);
  }

  if (!apply) {
    console.log(
      "\nDRY-RUN. Re-run with --apply to perform the update on the database.",
    );
    await prisma.$disconnect();
    return;
  }

  let updated = 0;
  for (const it of items) {
    const newMode = OLD_TO_MODE[it.productId];
    const cfg =
      it.configJson && typeof it.configJson === "object" && !Array.isArray(it.configJson)
        ? ({ ...(it.configJson as Record<string, unknown>) } as Record<string, unknown>)
        : {};
    cfg.sourceMode = newMode;

    // Migrate add-on IDs from anim-{suffix}-{addon} to anim-{addon}
    let renamedAddOns: Prisma.InputJsonValue | undefined;
    if (Array.isArray(it.addOnsJson)) {
      const arr = it.addOnsJson as Array<Record<string, unknown>>;
      renamedAddOns = arr.map((ao) => {
        const id = typeof ao.addOnId === "string" ? ao.addOnId : null;
        if (!id) return ao;
        const renamed = id
          .replace(/^anim-scratch-/, "anim-")
          .replace(/^anim-exist-/, "anim-")
          .replace(/^anim-active-/, "anim-");
        return id === renamed ? ao : { ...ao, addOnId: renamed };
      }) as unknown as Prisma.InputJsonValue;
    }

    await prisma.orderItem.update({
      where: { id: it.id },
      data: {
        productId: NEW_PRODUCT_ID,
        productLabel: NEW_PRODUCT_LABEL,
        categoryLabel: NEW_CATEGORY_LABEL,
        configJson: cfg as Prisma.InputJsonValue,
        ...(renamedAddOns !== undefined
          ? { addOnsJson: renamedAddOns }
          : {}),
      },
    });
    updated++;
  }

  console.log(`\nMigrated ${updated} OrderItem(s) to productId="${NEW_PRODUCT_ID}".`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
