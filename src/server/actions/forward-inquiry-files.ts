/**
 * forward-inquiry-files.ts — Server-side copy of files attached to a
 * ProjectInquiry into the OrderFile rows of the order produced by
 * convertInquiryToOrder. Both row sets persist (the inquiry stays
 * intact for audit), but the order gets its own copies in storage
 * under `orders/{orderId}/source/from-inquiry-{fileId}-{name}` so
 * deletion semantics on the order side are independent.
 *
 * Best-effort: a failure to forward a single file logs to Sentry but
 * doesn't unwind the conversion. Admin can still re-fetch attachments
 * via the "Iz upita" link added in #105 if needed.
 *
 * Why a separate file copy and not a shared storagePath: the bucket
 * has a global delete-by-path API and there's no cross-table
 * reference counting. Shared paths would create a class of bug
 * where deleting an inquiry's file orphans the order's pointer.
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import { UPLOADS_BUCKET } from "@/lib/file-scan";

export type ForwardInquiryFilesResult = {
  forwarded: number;
  skipped: number;
  errors: number;
};

export async function forwardInquiryFiles(
  inquiryId: string,
  orderId: string,
): Promise<ForwardInquiryFilesResult> {
  const files = await prisma.projectInquiryFile.findMany({
    where: { inquiryId },
    orderBy: { uploadedAt: "asc" },
  });

  let forwarded = 0;
  let skipped = 0;
  let errors = 0;

  if (files.length === 0) {
    return { forwarded, skipped, errors };
  }

  const supabase = getSupabaseAdmin();

  for (const file of files) {
    // Only forward files that passed the AV scan at submit time. An
    // inquiry should never have non-clean files (submitProjectInquiry
    // rejects the whole submission on infection), but stay defensive
    // — an older row pre-scan-era could exist.
    if (file.scanStatus && file.scanStatus !== "clean") {
      skipped += 1;
      continue;
    }

    const destPath = `orders/${orderId}/source/from-inquiry-${file.id}-${file.fileName}`;

    try {
      const copy = await supabase.storage
        .from(UPLOADS_BUCKET)
        .copy(file.storagePath, destPath);
      if (copy.error) {
        // Treat "object exists" as a benign retry (a partial earlier
        // forwarding attempt landed the file but missed the DB row).
        // Anything else is a real failure.
        if (
          copy.error.message.toLowerCase().includes("already exists") ||
          copy.error.message.toLowerCase().includes("duplicate")
        ) {
          // Fall through to DB insert — file is at destPath already.
        } else {
          throw new Error(`storage.copy failed: ${copy.error.message}`);
        }
      }

      // Idempotent insert — if a previous attempt landed the OrderFile
      // row, skip. We use storagePath as the dedupe key since it
      // encodes the inquiry file id.
      const existing = await prisma.orderFile.findFirst({
        where: { orderId, storagePath: destPath },
        select: { id: true },
      });
      if (existing) {
        skipped += 1;
        continue;
      }

      await prisma.orderFile.create({
        data: {
          orderId,
          fileName: file.fileName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          storagePath: destPath,
          kind: "source",
          scanStatus: "clean",
          scannedAt: file.scannedAt ?? new Date(),
        },
      });
      forwarded += 1;
    } catch (err) {
      errors += 1;
      Sentry.captureException(err, {
        tags: { area: "inquiry", flow: "forward-files" },
        extra: { inquiryId, orderId, fileId: file.id },
      });
    }
  }

  return { forwarded, skipped, errors };
}
