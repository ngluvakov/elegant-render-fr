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
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyTurnstile } from "@/lib/turnstile";
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
import { irisAfter } from "@/server/iris/client";
import { irisInquiry } from "@/server/iris/sync";

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
  // Anti-spam. `companyWebsite` is a honeypot — a hidden field no human
  // fills; any value means a bot and we reject silently. `turnstileToken`
  // is the Cloudflare Turnstile response verified server-side.
  companyWebsite?: string;
  turnstileToken?: string;
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
    return { error: "Vous pouvez joindre jusqu’à 12 fichiers." };
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
      return { error: "L’un des fichiers joints n’est pas valide." };
    }
    if (fileSize <= 0 || fileSize > PROJECT_INQUIRY_MAX_FILE_BYTES) {
      return { error: "L’un des fichiers dépasse la limite de 50 Mo." };
    }
    if (!isAllowedProjectInquiryMimeType(mimeType)) {
      return { error: "Les types de fichiers pris en charge sont JPG, PNG, WebP, TIFF et PDF." };
    }
    if (!storagePath.startsWith(`inquiries/${draftId}/`)) {
      return { error: "Le chemin du fichier joint n’est pas valide." };
    }
    if (seen.has(storagePath)) continue;
    seen.add(storagePath);
    total += fileSize;
    cleaned.push({ fileName, fileSize, mimeType, storagePath });
  }

  if (total > PROJECT_INQUIRY_MAX_TOTAL_BYTES) {
    return { error: "La taille totale des fichiers dépasse 100 Mo." };
  }

  return cleaned;
}

function adminInquiryUrl(inquiryId: string): string {
  const base =
    process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.AUTH_URL ?? "http://localhost:3000";
  return `${base}/portal/admin/inquiries?highlight=${encodeURIComponent(inquiryId)}`;
}

export async function submitProjectInquiry(
  input: SubmitProjectInquiryInput,
): Promise<SubmitProjectInquiryResult> {
  const identifier = await getServerActionIdentifier();
  const limit = await checkRateLimit("projectInquiry", identifier);
  if (!limit.ok) return { error: rateLimitMessage(limit.retryAfterSeconds) };

  if (!input || typeof input !== "object") {
    return { error: "Requête non valide." };
  }

  // Honeypot: a hidden `company_website` field that no human sees. If a bot
  // fills it, reject silently — return success so the bot can't learn the
  // form is protected. No DB row, no lead, no email.
  if (String(input.companyWebsite ?? "").trim() !== "") {
    return { ok: true, inquiryId: "" };
  }

  // Cloudflare Turnstile. No-ops (ok=true) when TURNSTILE_SECRET_KEY is
  // unset (local dev / preview), so the form stays usable until keys are
  // configured in Vercel.
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const captcha = await verifyTurnstile(input.turnstileToken, ip);
  if (!captcha.ok) {
    return { error: "La vérification du captcha a échoué. Veuillez réessayer." };
  }

  const draftId = cleanRequired(input.draftId, 80);
  if (!validDraftId(draftId)) return { error: "Brouillon de demande non valide." };

  const contactName = cleanRequired(input.contactName, 120);
  if (contactName.length < 2) return { error: "Le nom est requis." };

  const email = cleanRequired(input.email, 200).toLowerCase();
  if (!validEmail(email)) return { error: "L’adresse e-mail n’est pas valide." };

  const message = cleanRequired(input.message, 4000);
  if (message.length < 8) {
    return { error: "Ajoutez au moins une brève description du projet." };
  }

  const files = validateFiles(input.files, draftId);
  if ("error" in files) return files;

  // ISO 27001 A.8.7. Sync AV scan all attached files in parallel before
  // creating any DB rows. An infected file ALWAYS rejects the whole inquiry.
  // But when the scanner is UNAVAILABLE, instead of silently losing the lead
  // (incident 2026-06-24: a customer sent photos of the space, Cloudmersive
  // went down, the inquiry vanished without a trace), we QUARANTINE the
  // files (scanStatus "pending", kept in storage) and let the inquiry save —
  // the customer's contact is worth more than an instant check. Admin gets
  // a warning and reviews manually.
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
    // With "quarantine", the only remaining ok:false is an infected file.
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

  // Visitor geo from Vercel (absent locally). City arrives URL-encoded.
  const geo = await headers();
  const countryCode = geo.get("x-vercel-ip-country")?.trim().toUpperCase() ?? null;
  const cityRaw = geo.get("x-vercel-ip-city");
  let city: string | null = null;
  try {
    city = cityRaw ? decodeURIComponent(cityRaw).slice(0, 120) : null;
  } catch {
    city = cityRaw?.slice(0, 120) ?? null;
  }

  const inquiry = await prisma.projectInquiry.create({
    data: {
      countryCode: countryCode && /^[A-Z]{2}$/.test(countryCode) ? countryCode : null,
      city,
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
          // Marked as scanned right now only when clean; pending awaits a
          // manual review, so it has no scan timestamp.
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
  irisAfter("inquiry", { inquiryId: inquiry.id }, () => irisInquiry(inquiry.id));

  // Visible alarm when a lead came in with unscanned files — previously the
  // whole inquiry would silently vanish. Goes to Sentry (message, not
  // exception) so it doesn't get lost in the noise and the frequency of
  // scanner outages stays visible.
  if (quarantinedCount > 0) {
    Sentry.captureMessage(
      `Inquiry ${inquiry.id} saved with ${quarantinedCount} unscanned file(s) (scanner unavailable) — manual review required.`,
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

  revalidatePath("/portal/admin/inquiries");
  return { ok: true, inquiryId: inquiry.id };
}

async function assertAdmin(): Promise<{ ok: true } | { error: string }> {
  try {
    await requirePermission("INQUIRIES_MANAGE");
    return { ok: true };
  } catch {
    return { error: "Vous n’y avez pas accès." };
  }
}

export async function updateProjectInquiryStatus(
  inquiryId: string,
  status: ProjectInquiryStatus,
): Promise<{ ok: true } | { error: string }> {
  const admin = await assertAdmin();
  if ("error" in admin) return admin;
  if (!VALID_STATUSES.includes(status)) return { error: "Statut inconnu." };

  await prisma.projectInquiry.update({
    where: { id: inquiryId },
    data: {
      status,
      reviewedAt: status === "pending" ? null : new Date(),
    },
  });

  revalidatePath("/portal/admin/inquiries");
  return { ok: true };
}

export async function retryProjectInquiryBitrixSync(
  inquiryId: string,
): Promise<{ ok: true; bitrixLeadId: string | null } | { error: string }> {
  const admin = await assertAdmin();
  if ("error" in admin) return admin;

  try {
    const bitrixLeadId = await syncProjectInquiryLead(inquiryId);
    revalidatePath("/portal/admin/inquiries");
    return { ok: true, bitrixLeadId };
  } catch (err) {
    revalidatePath("/portal/admin/inquiries");
    return {
      error:
        err instanceof Error
          ? err.message
          : "La synchronisation Bitrix a échoué cette fois. Veuillez réessayer.",
    };
  }
}
