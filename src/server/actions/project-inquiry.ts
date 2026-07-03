/**
 * project-inquiry.ts — Server actions for public pre-sales project briefs.
 *
 * Visitors can submit a fast inquiry instead of finishing self-serve checkout.
 * We persist the brief and uploaded file metadata, notify the team/customer,
 * and sync to Bitrix24 as a Lead on a best-effort basis.
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import type { Prisma } from "@/generated/prisma/client";
import {
  PROJECT_INQUIRY_MAX_FILE_BYTES,
  PROJECT_INQUIRY_MAX_TOTAL_BYTES,
  isAllowedProjectInquiryMimeType,
  type ProjectInquiryFileInput,
} from "@/lib/project-inquiry";
import {
  UPLOADS_BUCKET,
  deleteStorageObject,
  enforceCleanScan,
} from "@/lib/file-scan";
import {
  checkRateLimit,
  getServerActionIdentifier,
  rateLimitMessage,
} from "@/lib/rate-limit";
import {
  sendProjectInquiryAdminEmail,
  sendProjectInquiryCustomerEmail,
} from "@/lib/email";
import { syncProjectInquiryLead } from "@/server/bitrix/sync-project-inquiry";

export type SubmitProjectInquiryInput = {
  draftId: string;
  contactName: string;
  email: string;
  phone?: string;
  company?: string;
  serviceType?: string;
  budget?: string;
  deadline?: string;
  message: string;
  source?: string;
  sourcePath?: string;
  sourceLabel?: string;
  quoteSnapshot?: unknown;
  files?: ProjectInquiryFileInput[];
};

export type SubmitProjectInquiryResult =
  | { ok: true; inquiryId: string }
  | { error: string };

const VALID_STATUSES = [
  "pending",
  "in_progress",
  "proposal_sent",
  "converted",
  "closed",
] as const;

type ProjectInquiryStatus = (typeof VALID_STATUSES)[number];

function validEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function cleanOptional(value: unknown, max: number): string | undefined {
  const text = String(value ?? "").trim().slice(0, max);
  return text || undefined;
}

function cleanRequired(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function validDraftId(draftId: string): boolean {
  return /^[a-zA-Z0-9_-]{8,80}$/.test(draftId);
}

function sanitizeQuoteSnapshot(raw: unknown): Prisma.InputJsonValue | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  try {
    const serialized = JSON.stringify(raw);
    if (serialized.length > 20_000) return undefined;
    return JSON.parse(serialized) as Prisma.InputJsonValue;
  } catch {
    return undefined;
  }
}

function validateFiles(
  files: ProjectInquiryFileInput[] | undefined,
  draftId: string,
): ProjectInquiryFileInput[] | { error: string } {
  if (!files?.length) return [];
  if (files.length > 12) {
    return { error: "Možete priložiti najviše 12 fajlova." };
  }

  let total = 0;
  const seen = new Set<string>();
  const cleaned: ProjectInquiryFileInput[] = [];

  for (const file of files) {
    const fileName = cleanRequired(file.fileName, 180);
    const mimeType = cleanRequired(file.mimeType, 80);
    const storagePath = cleanRequired(file.storagePath, 500);
    const fileSize = Number(file.fileSize);

    if (!fileName || !mimeType || !storagePath || !Number.isFinite(fileSize)) {
      return { error: "Jedan od priloženih fajlova nije ispravan." };
    }
    if (fileSize <= 0 || fileSize > PROJECT_INQUIRY_MAX_FILE_BYTES) {
      return { error: "Jedan od fajlova prelazi limit od 50MB." };
    }
    if (!isAllowedProjectInquiryMimeType(mimeType)) {
      return { error: "Podržani su JPG, PNG, WebP, TIFF i PDF fajlovi." };
    }
    if (!storagePath.startsWith(`inquiries/${draftId}/`)) {
      return { error: "Putanja priloženog fajla nije ispravna." };
    }
    if (seen.has(storagePath)) continue;
    seen.add(storagePath);
    total += fileSize;
    cleaned.push({ fileName, fileSize, mimeType, storagePath });
  }

  if (total > PROJECT_INQUIRY_MAX_TOTAL_BYTES) {
    return { error: "Ukupna veličina fajlova prelazi 100MB." };
  }

  return cleaned;
}

function adminInquiryUrl(inquiryId: string): string {
  const base =
    process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.AUTH_URL ?? "http://localhost:3000";
  return `${base}/portal/admin/upiti?highlight=${encodeURIComponent(inquiryId)}`;
}

export async function submitProjectInquiry(
  input: SubmitProjectInquiryInput,
): Promise<SubmitProjectInquiryResult> {
  const identifier = await getServerActionIdentifier();
  const limit = await checkRateLimit("projectInquiry", identifier);
  if (!limit.ok) return { error: rateLimitMessage(limit.retryAfterSeconds) };

  if (!input || typeof input !== "object") {
    return { error: "Neispravan zahtev." };
  }

  const draftId = cleanRequired(input.draftId, 80);
  if (!validDraftId(draftId)) return { error: "Neispravan draft upita." };

  const contactName = cleanRequired(input.contactName, 120);
  if (contactName.length < 2) return { error: "Ime je obavezno." };

  const email = cleanRequired(input.email, 200).toLowerCase();
  if (!validEmail(email)) return { error: "Email adresa nije ispravna." };

  const message = cleanRequired(input.message, 4000);
  if (message.length < 8) {
    return { error: "Dodajte bar kratak opis projekta." };
  }

  const files = validateFiles(input.files, draftId);
  if ("error" in files) return files;

  // ISO 27001 A.8.7. Sync AV scan all attached files in parallel before
  // creating any DB rows. Zaražen fajl UVEK odbija ceo upit. Ali kad je
  // skener NEDOSTUPAN, umesto da tiho izgubimo lead (incident 2026-06-24:
  // kupac slao fotografije prostora, Cloudmersive pao, upit nestao bez
  // traga), fajlove stavljamo u KARANTIN (scanStatus "pending", zadržani
  // u storage-u) i puštamo upit da se sačuva — kontakt kupca je vredniji
  // od trenutne provere. Admin dobija upozorenje i proverava ručno.
  const fileScanStatus: Array<"clean" | "pending"> = files.map(() => "clean");
  let quarantinedCount = 0;
  if (files.length > 0) {
    const scanResults = await Promise.all(
      files.map((f) =>
        enforceCleanScan({
          storagePath: f.storagePath,
          fileName: f.fileName,
          fileSize: f.fileSize,
          mimeType: f.mimeType,
          entityType: "ProjectInquiryDraft",
          entityId: draftId,
          onScanUnavailable: "quarantine",
        }),
      ),
    );
    // Uz "quarantine" jedini preostali ok:false je zaražen fajl.
    const infected = scanResults.find((r) => !r.ok);
    if (infected && !infected.ok) {
      // Best-effort cleanup of any other files in the same inquiry —
      // they were uploaded together and only make sense as a set.
      await Promise.allSettled(
        scanResults.map((result, idx) =>
          result.ok
            ? deleteStorageObject({
                bucket: UPLOADS_BUCKET,
                path: files[idx].storagePath,
              })
            : Promise.resolve(),
        ),
      );
      return { error: infected.userError };
    }
    scanResults.forEach((result, idx) => {
      if (result.ok) fileScanStatus[idx] = result.scanStatus;
    });
    quarantinedCount = fileScanStatus.filter((s) => s === "pending").length;
  }

  const session = await auth();
  const quoteSnapshot = sanitizeQuoteSnapshot(input.quoteSnapshot);
  const scannedAt = new Date();

  const inquiry = await prisma.projectInquiry.create({
    data: {
      source: cleanOptional(input.source, 80) ?? null,
      sourcePath: cleanOptional(input.sourcePath, 240) ?? null,
      sourceLabel: cleanOptional(input.sourceLabel, 160) ?? null,
      contactName,
      email,
      phone: cleanOptional(input.phone, 40) ?? null,
      company: cleanOptional(input.company, 120) ?? null,
      serviceType: cleanOptional(input.serviceType, 120) ?? null,
      budget: cleanOptional(input.budget, 80) ?? null,
      deadline: cleanOptional(input.deadline, 80) ?? null,
      message,
      userId: session?.user?.id ?? null,
      ...(quoteSnapshot ? { quoteSnapshotJson: quoteSnapshot } : {}),
      files: {
        create: files.map((file, idx) => ({
          fileName: file.fileName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          storagePath: file.storagePath,
          scanStatus: fileScanStatus[idx],
          // Skenirani u ovom trenutku samo ako je čist; pending čeka ručnu
          // proveru pa nema vreme skena.
          scannedAt: fileScanStatus[idx] === "clean" ? scannedAt : null,
        })),
      },
    },
    select: {
      id: true,
      phone: true,
      company: true,
      serviceType: true,
      budget: true,
      deadline: true,
      sourceLabel: true,
      _count: { select: { files: true } },
    },
  });

  syncProjectInquiryLead(inquiry.id).catch((err) => {
    Sentry.captureException(err, {
      tags: { area: "bitrix", flow: "sync-project-inquiry-lead" },
      extra: { inquiryId: inquiry.id },
    });
  });

  // Vidljiv alarm kad je lead ušao sa neskeniranim fajlovima — ranije bi
  // ceo upit tiho nestao. Ide u Sentry (message, ne exception) da se ne
  // izgubi u šumu i da se vidi učestalost skenerskih ispada.
  if (quarantinedCount > 0) {
    Sentry.captureMessage(
      `Upit ${inquiry.id} sačuvan sa ${quarantinedCount} neskeniranih fajlova (skener nedostupan) — potrebna ručna provera.`,
      {
        level: "warning",
        tags: { area: "project-inquiry", flow: "scan-quarantine" },
        extra: { inquiryId: inquiry.id, quarantinedCount },
      },
    );
  }

  await Promise.allSettled([
    sendProjectInquiryAdminEmail({
      inquiryId: inquiry.id,
      adminUrl: adminInquiryUrl(inquiry.id),
      contactName,
      email,
      phone: inquiry.phone ?? undefined,
      company: inquiry.company ?? undefined,
      serviceType: inquiry.serviceType ?? undefined,
      budget: inquiry.budget ?? undefined,
      deadline: inquiry.deadline ?? undefined,
      message,
      sourceLabel: inquiry.sourceLabel ?? undefined,
      fileCount: inquiry._count.files,
      unscannedFileCount: quarantinedCount,
    }),
    sendProjectInquiryCustomerEmail({
      to: email,
      contactName,
    }),
  ]);

  revalidatePath("/portal/admin/upiti");
  return { ok: true, inquiryId: inquiry.id };
}

async function assertAdmin(): Promise<{ ok: true } | { error: string }> {
  try {
    await requirePermission("INQUIRIES_MANAGE");
    return { ok: true };
  } catch {
    return { error: "Nemate pristup." };
  }
}

export async function updateProjectInquiryStatus(
  inquiryId: string,
  status: ProjectInquiryStatus,
): Promise<{ ok: true } | { error: string }> {
  const admin = await assertAdmin();
  if ("error" in admin) return admin;
  if (!VALID_STATUSES.includes(status)) return { error: "Nepoznat status." };

  await prisma.projectInquiry.update({
    where: { id: inquiryId },
    data: {
      status,
      reviewedAt: status === "pending" ? null : new Date(),
    },
  });

  revalidatePath("/portal/admin/upiti");
  return { ok: true };
}

export async function retryProjectInquiryBitrixSync(
  inquiryId: string,
): Promise<{ ok: true; bitrixLeadId: string | null } | { error: string }> {
  const admin = await assertAdmin();
  if ("error" in admin) return admin;

  try {
    const bitrixLeadId = await syncProjectInquiryLead(inquiryId);
    revalidatePath("/portal/admin/upiti");
    return { ok: true, bitrixLeadId };
  } catch (err) {
    revalidatePath("/portal/admin/upiti");
    return {
      error:
        err instanceof Error
          ? err.message
          : "Bitrix sync trenutno nije uspeo.",
    };
  }
}
