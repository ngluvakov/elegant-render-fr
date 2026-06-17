import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DIRECT_URL ?? process.env.DATABASE_URL!),
});

async function main() {
  const confirmed =
    process.argv.includes("--yes") || process.env.RESET_TEST_DATA_KEEP_USERS === "1";

  if (!confirmed) {
    throw new Error(
      "Refusing to reset data. Re-run with --yes or RESET_TEST_DATA_KEEP_USERS=1.",
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.outboxEvent.deleteMany();
      await tx.invoiceCounter.deleteMany();
      await tx.proformaCounter.deleteMany();

      await tx.bitrixSyncLog.deleteMany();
      await tx.chatFeedback.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.userUsageDaily.deleteMany();

      await tx.projectInquiryFile.deleteMany();
      await tx.projectInquiry.deleteMany();
      await tx.vrInquiry.deleteMany();
      await tx.quote.deleteMany();

      await tx.aiGenerationReferenceImage.deleteMany();
      await tx.aiGeneration.deleteMany();
      await tx.aiCreditTransaction.deleteMany();

      await tx.orderChargeItem.deleteMany();
      await tx.orderCharge.deleteMany();
      await tx.orderComment.deleteMany();
      await tx.orderStatusEvent.deleteMany();
      await tx.orderFile.deleteMany();
      await tx.orderItem.deleteMany();
      await tx.order.deleteMany();

      await tx.pricingChangeLog.deleteMany();
      await tx.pricingSetting.deleteMany();
      await tx.pricingDurationRule.deleteMany();
      await tx.pricingDiscountRule.deleteMany();
      await tx.pricingAddOn.deleteMany();
      await tx.pricingProduct.deleteMany();
      await tx.pricingBook.deleteMany();
    },
    { timeout: 120_000 },
  );

  console.log(
    "Reset complete. Preserved users, accounts, sessions, verification tokens, admin flags/permissions, and user profile fields.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
