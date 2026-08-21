/**
 * job-application.ts — Server action for the public /jobs application form.
 *
 * Mirrors project-inquiry.ts: rate limit + honeypot + Turnstile, AV-scan of
 * the uploaded CV/portfolio files, persist the application, then notify the
 * team (with 30-day signed download links) and confirm to the candidate.
 * No Bitrix sync — hiring stays out of the sales CRM.
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyTurnstile } from "@/lib/turnstile";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  JOB_APPLICATION_MAX_FILE_BYTES,
  JOB_APPLICATION_MAX_TOTAL_BYTES,
  JOB_APPLICATION_MAX_PORTFOLIO_FILES,
  isAllowedJobApplicationMimeType,
  type JobApplicationFileInput,
} from "@/lib/job-application";
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
  sendJobApplicationAdminEmail,
  sendJobApplicationCandidateEmail,
} from "@/lib/email";

export type SubmitJobApplicationInput = {
  draftId: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  position: string;
  employmentType?: string;
  availableFrom?: string;
  expectedSalary?: string;
  experienceYears?: string;
  education?: string;
  coverLetter: string;
  software?: string[];
  softwareOther?: string;
  skills?: string[];
  skillsOther?: string;
  files?: JobApplicationFileInput[];
  // Anti-spam — same contract as project inquiries: hidden honeypot field
  // plus a server-verified Cloudflare Turnstile token.
  companyWebsite?: string;
  turnstileToken?: string;
};

export type SubmitJobApplicationResult =
  | { ok: true; applicationId: string }
  | { error: string };

const SIGNED_LINK_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days

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

function cleanUrl(value: unknown): string | undefined {
  const text = cleanOptional(value, 300);
  if (!text) return undefined;
  const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function cleanChecklist(raw: unknown, max: number): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  for (const item of raw.slice(0, max)) {
    const label = cleanRequired(item, 80);
    if (label) seen.add(label);
  }
  return [...seen];
}

function validateFiles(
  files: JobApplicationFileInput[] | undefined,
  draftId: string,
): JobApplicationFileInput[] | { error: string } {
  if (!files?.length) return [];
  if (files.length > 1 + JOB_APPLICATION_MAX_PORTFOLIO_FILES) {
    return { error: "Joignez un CV et jusqu’à 3 fichiers de portfolio." };
  }

  let total = 0;
  let cvCount = 0;
  const seen = new Set<string>();
  const cleaned: JobApplicationFileInput[] = [];

  for (const file of files) {
    const kind = file.kind === "cv" ? "cv" : "portfolio";
    const fileName = cleanRequired(file.fileName, 180);
    const mimeType = cleanRequired(file.mimeType, 80);
    const storagePath = cleanRequired(file.storagePath, 500);
    const fileSize = Number(file.fileSize);
    if (!fileName || !mimeType || !storagePath || !Number.isFinite(fileSize)) {
      return { error: "L’un des fichiers n’est pas valide." };
    }
    if (fileSize <= 0 || fileSize > JOB_APPLICATION_MAX_FILE_BYTES) {
      return { error: "L’un des fichiers dépasse 50 Mo." };
    }
    if (!isAllowedJobApplicationMimeType(mimeType)) {
      return { error: "Les types de fichiers autorisés sont PDF, DOC, DOCX, ZIP, JPG, PNG et WebP." };
    }
    if (!storagePath.startsWith(`jobs/${draftId}/`)) {
      return { error: "L’un des fichiers n’est pas valide." };
    }
    if (seen.has(storagePath)) continue;
    seen.add(storagePath);
    if (kind === "cv") cvCount += 1;
    total += fileSize;
    cleaned.push({ kind, fileName, fileSize, mimeType, storagePath });
  }

  if (cvCount > 1) return { error: "Joignez un seul fichier CV." };
  if (total > JOB_APPLICATION_MAX_TOTAL_BYTES) {
    return { error: "La taille totale des fichiers dépasse 100 Mo." };
  }

  return cleaned;
}

export async function submitJobApplication(
  input: SubmitJobApplicationInput,
): Promise<SubmitJobApplicationResult> {
  const identifier = await getServerActionIdentifier();
  const limit = await checkRateLimit("jobApplication", identifier);
  if (!limit.ok) return { error: rateLimitMessage(limit.retryAfterSeconds) };

  if (!input || typeof input !== "object") {
    return { error: "Requête non valide." };
  }

  // Honeypot — same contract as project inquiries: reject silently so a
  // bot can't learn the form is protected.
  if (String(input.companyWebsite ?? "").trim() !== "") {
    return { ok: true, applicationId: "" };
  }

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const captcha = await verifyTurnstile(input.turnstileToken, ip);
  if (!captcha.ok) {
    return { error: "La vérification du captcha a échoué. Veuillez réessayer." };
  }

  const draftId = cleanRequired(input.draftId, 80);
  if (!validDraftId(draftId)) return { error: "Brouillon de candidature non valide." };

  const fullName = cleanRequired(input.fullName, 120);
  if (fullName.length < 2) return { error: "Le nom est requis." };

  const email = cleanRequired(input.email, 200).toLowerCase();
  if (!validEmail(email)) return { error: "L’adresse e-mail n’est pas valide." };

  const position = cleanRequired(input.position, 120);
  if (!position) return { error: "Choisissez le poste auquel vous postulez." };

  const coverLetter = cleanRequired(input.coverLetter, 6000);
  if (coverLetter.length < 8) {
    return { error: "Expliquez-nous au moins brièvement pourquoi vous postulez." };
  }

  const files = validateFiles(input.files, draftId);
  if ("error" in files) return files;
  if (!files.some((file) => file.kind === "cv")) {
    return { error: "Veuillez joindre votre CV." };
  }

  // Same AV policy as inquiries (ISO 27001 A.8.7): an infected file always
  // rejects the application; an unavailable scanner quarantines instead of
  // losing the candidate.
  const fileScanStatus: Array<"clean" | "pending"> = files.map(() => "clean");
  let quarantinedCount = 0;
  const scanResults = await Promise.all(
    files.map((f) =>
      enforceCleanScan({
        storagePath: f.storagePath,
        fileName: f.fileName,
        fileSize: f.fileSize,
        mimeType: f.mimeType,
        entityType: "JobApplicationDraft",
        entityId: draftId,
        onScanUnavailable: "quarantine",
      }),
    ),
  );
  const infected = scanResults.find((r) => !r.ok);
  if (infected && !infected.ok) {
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

  const scannedAt = new Date();
  const software = cleanChecklist(input.software, 40);
  const skills = cleanChecklist(input.skills, 40);

  const application = await prisma.jobApplication.create({
    data: {
      fullName,
      email,
      phone: cleanOptional(input.phone, 40) ?? null,
      location: cleanOptional(input.location, 120) ?? null,
      linkedinUrl: cleanUrl(input.linkedinUrl) ?? null,
      portfolioUrl: cleanUrl(input.portfolioUrl) ?? null,
      position,
      employmentType: cleanOptional(input.employmentType, 60) ?? null,
      availableFrom: cleanOptional(input.availableFrom, 80) ?? null,
      expectedSalary: cleanOptional(input.expectedSalary, 80) ?? null,
      experienceYears: cleanOptional(input.experienceYears, 40) ?? null,
      education: cleanOptional(input.education, 240) ?? null,
      coverLetter,
      software,
      softwareOther: cleanOptional(input.softwareOther, 240) ?? null,
      skills,
      skillsOther: cleanOptional(input.skillsOther, 240) ?? null,
      files: {
        create: files.map((file, idx) => ({
          kind: file.kind,
          fileName: file.fileName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          storagePath: file.storagePath,
          scanStatus: fileScanStatus[idx],
          scannedAt: fileScanStatus[idx] === "clean" ? scannedAt : null,
        })),
      },
    },
    select: { id: true },
  });

  if (quarantinedCount > 0) {
    Sentry.captureMessage(
      `Job application ${application.id} saved with ${quarantinedCount} unscanned file(s) (scanner unavailable) — manual review required.`,
      {
        level: "warning",
        tags: { area: "job-application", flow: "scan-quarantine" },
        extra: { applicationId: application.id, quarantinedCount },
      },
    );
  }

  // 30-day signed download links so the team can open the CV/portfolio
  // straight from the notification email (no admin UI needed yet).
  const fileLinks = await Promise.all(
    files.map(async (file) => {
      const { data, error } = await getSupabaseAdmin()
        .storage.from(UPLOADS_BUCKET)
        .createSignedUrl(file.storagePath, SIGNED_LINK_EXPIRY_SECONDS);
      if (error) {
        Sentry.captureMessage(
          `Could not sign download link for job application file: ${error.message}`,
          {
            level: "warning",
            tags: { area: "job-application", flow: "signed-link" },
            extra: { applicationId: application.id, path: file.storagePath },
          },
        );
      }
      return {
        label: file.kind === "cv" ? "CV" : "Portfolio",
        url: data?.signedUrl ?? null,
        fileName: file.fileName,
      };
    }),
  );

  // Notifications are best-effort: the application is already persisted, so
  // an email outage must not fail the submission.
  try {
    await sendJobApplicationAdminEmail({
      applicationId: application.id,
      fullName,
      email,
      phone: cleanOptional(input.phone, 40),
      location: cleanOptional(input.location, 120),
      linkedinUrl: cleanUrl(input.linkedinUrl),
      portfolioUrl: cleanUrl(input.portfolioUrl),
      position,
      employmentType: cleanOptional(input.employmentType, 60),
      availableFrom: cleanOptional(input.availableFrom, 80),
      expectedSalary: cleanOptional(input.expectedSalary, 80),
      experienceYears: cleanOptional(input.experienceYears, 40),
      education: cleanOptional(input.education, 240),
      coverLetter,
      software,
      softwareOther: cleanOptional(input.softwareOther, 240),
      skills,
      skillsOther: cleanOptional(input.skillsOther, 240),
      fileLinks,
      unscannedFileCount: quarantinedCount,
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "job-application", flow: "admin-email" },
      extra: { applicationId: application.id },
    });
  }

  try {
    await sendJobApplicationCandidateEmail({
      to: email,
      fullName,
      position,
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "job-application", flow: "candidate-email" },
      extra: { applicationId: application.id },
    });
  }

  return { ok: true, applicationId: application.id };
}
