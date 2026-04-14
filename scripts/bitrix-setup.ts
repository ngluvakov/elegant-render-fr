// Creates the "Elegant Render" pipeline and stages in Bitrix24
// Run: npx tsx scripts/bitrix-setup.ts

import { config } from "dotenv";
config({ path: ".env.local" });

const WEBHOOK = process.env.BITRIX24_WEBHOOK_URL!;

async function call(method: string, params: Record<string, unknown> = {}) {
  const res = await fetch(`${WEBHOOK}${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (data.error) throw new Error(`${method}: ${JSON.stringify(data.error)}`);
  return data.result;
}

async function main() {
  console.log("Creating Elegant Render pipeline...\n");

  // Create pipeline (deal category)
  const categoryId = await call("crm.dealcategory.add", {
    fields: { NAME: "Elegant Render" },
  });
  console.log(`Pipeline created: ID = ${categoryId}`);

  // Define stages
  const stages = [
    { NAME: "Novo", SORT: 10, STATUS_ID: "NEW" },
    { NAME: "Čeka uplatu", SORT: 20, STATUS_ID: "AWAITING_PAYMENT" },
    { NAME: "Plaćeno", SORT: 30, STATUS_ID: "PAID" },
    { NAME: "U izradi", SORT: 40, STATUS_ID: "IN_PROGRESS" },
    { NAME: "Na pregledu", SORT: 50, STATUS_ID: "IN_REVIEW" },
    { NAME: "Izmene", SORT: 60, STATUS_ID: "REVISION" },
    { NAME: "Isporučeno", SORT: 70, STATUS_ID: "DELIVERED", SEMANTICS: "S" },
    { NAME: "Zatvoreno", SORT: 80, STATUS_ID: "CLOSED", SEMANTICS: "S" },
    { NAME: "Otkazano", SORT: 90, STATUS_ID: "CANCELLED", SEMANTICS: "F" },
    { NAME: "Refundirano", SORT: 100, STATUS_ID: "REFUNDED", SEMANTICS: "F" },
  ];

  // Add stages to the pipeline via crm.status.add
  const stageIds: Record<string, string> = {};
  const entityId = `DEAL_STAGE_${categoryId}`;

  for (const stage of stages) {
    const statusId = `C${categoryId}:${stage.STATUS_ID}`;

    try {
      await call("crm.status.add", {
        fields: {
          ENTITY_ID: entityId,
          STATUS_ID: statusId,
          NAME: stage.NAME,
          SORT: stage.SORT,
          SEMANTICS: stage.SEMANTICS ?? "P",
        },
      });
    } catch (err) {
      // Stage might already exist, try to continue
      console.log(`  Warning: ${stage.NAME} — ${err instanceof Error ? err.message : err}`);
    }

    stageIds[stage.STATUS_ID] = statusId;
    console.log(`  Stage: ${stage.NAME} → ${statusId}`);

    await new Promise((r) => setTimeout(r, 600));
  }

  // Print env vars
  console.log("\n=== Add these to .env.local ===\n");
  console.log(`BITRIX24_PIPELINE_ID=${categoryId}`);
  console.log(`BITRIX24_STAGE_DRAFT=${stageIds.NEW}`);
  console.log(`BITRIX24_STAGE_AWAITING_PAYMENT=${stageIds.AWAITING_PAYMENT}`);
  console.log(`BITRIX24_STAGE_PAID=${stageIds.PAID}`);
  console.log(`BITRIX24_STAGE_IN_PROGRESS=${stageIds.IN_PROGRESS}`);
  console.log(`BITRIX24_STAGE_IN_REVIEW=${stageIds.IN_REVIEW}`);
  console.log(`BITRIX24_STAGE_REVISION_REQUESTED=${stageIds.REVISION}`);
  console.log(`BITRIX24_STAGE_DELIVERED=${stageIds.DELIVERED}`);
  console.log(`BITRIX24_STAGE_CLOSED=${stageIds.CLOSED}`);
  console.log(`BITRIX24_STAGE_CANCELLED=${stageIds.CANCELLED}`);
  console.log(`BITRIX24_STAGE_REFUNDED=${stageIds.REFUNDED}`);
}

main().catch(console.error);
