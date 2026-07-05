/**
 * sync-project-inquiry.ts — Best-effort Bitrix24 Lead sync for public
 * pre-sales inquiries. Inquiry submit must stay successful even when CRM
 * is temporarily unavailable; errors are persisted for admin retry.
 */
import { prisma } from "@/lib/db";
import { bitrixCall } from "@/lib/bitrix24/client";

function getBaseUrl(): string {
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.AUTH_URL ?? "http://localhost:3000";
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || "Klijent",
    lastName: parts.slice(1).join(" "),
  };
}

function formatQuoteSnapshot(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  try {
    return JSON.stringify(raw, null, 2).slice(0, 4000);
  } catch {
    return null;
  }
}

async function persistSyncError(inquiryId: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  await prisma.projectInquiry.update({
    where: { id: inquiryId },
    data: { bitrixSyncError: message.slice(0, 4000) },
  });
}

export async function syncProjectInquiryLead(
  inquiryId: string,
): Promise<string | null> {
  const inquiry = await prisma.projectInquiry.findUniqueOrThrow({
    where: { id: inquiryId },
    include: { files: true },
  });

  if (inquiry.bitrixLeadId) return inquiry.bitrixLeadId;

  if (!process.env.BITRIX24_WEBHOOK_URL) {
    const err = new Error("BITRIX24_WEBHOOK_URL is not set");
    await persistSyncError(inquiry.id, err);
    throw err;
  }

  const { firstName, lastName } = splitName(inquiry.contactName);
  const adminUrl = `${getBaseUrl()}/portal/admin/inquiries`;
  const quoteSnapshot = formatQuoteSnapshot(inquiry.quoteSnapshotJson);
  const fileLines =
    inquiry.files.length > 0
      ? inquiry.files
          .map(
            (file) =>
              `- ${file.fileName} (${(file.fileSize / (1024 * 1024)).toFixed(
                1,
              )} MB)`,
          )
          .join("\n")
      : "Nema priloženih fajlova.";

  const comments = [
    `Admin: ${adminUrl}`,
    `Upit ID: ${inquiry.id}`,
    inquiry.source ? `Izvor: ${inquiry.source}` : null,
    inquiry.sourcePath ? `Putanja: ${inquiry.sourcePath}` : null,
    inquiry.sourceLabel ? `CTA: ${inquiry.sourceLabel}` : null,
    inquiry.serviceType ? `Tip usluge: ${inquiry.serviceType}` : null,
    inquiry.budget ? `Budžet: ${inquiry.budget}` : null,
    inquiry.deadline ? `Rok: ${inquiry.deadline}` : null,
    "",
    "Opis:",
    inquiry.message,
    "",
    "Fajlovi:",
    fileLines,
    quoteSnapshot ? `\nSnapshot ponude:\n${quoteSnapshot}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  try {
    const leadId = await bitrixCall<number>(
      "crm.lead.add",
      {
        fields: {
          TITLE: `Elegant Render upit — ${inquiry.contactName}`,
          NAME: firstName,
          LAST_NAME: lastName,
          COMPANY_TITLE: inquiry.company ?? undefined,
          SOURCE_ID: "WEB",
          STATUS_ID: "NEW",
          EMAIL: [{ VALUE: inquiry.email, VALUE_TYPE: "WORK" }],
          PHONE: inquiry.phone
            ? [{ VALUE: inquiry.phone, VALUE_TYPE: "WORK" }]
            : [],
          COMMENTS: comments,
        },
      },
      { entityType: "project_inquiry", entityId: inquiry.id, direction: "outbound" },
    );

    await prisma.projectInquiry.update({
      where: { id: inquiry.id },
      data: {
        bitrixLeadId: String(leadId),
        bitrixSyncedAt: new Date(),
        bitrixSyncError: null,
      },
    });

    return String(leadId);
  } catch (err) {
    await persistSyncError(inquiry.id, err);
    throw err;
  }
}
