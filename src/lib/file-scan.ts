/**
 * file-scan.ts — Antivirus + malicious-content scanning for client uploads.
 *
 * Pipeline (synchronous):
 *   1. Client uploads to Supabase via signed URL.
 *   2. Server action (confirmItemFileUpload, submitProjectInquiry,
 *      startAiStudioGeneration) calls scanStorageObject() before the
 *      DB row is created.
 *   3. If clean, the action proceeds.
 *   4. If infected or scan unavailable, the action deletes the file
 *      from Supabase and returns an error.
 *
 * Provider: Cloudmersive Virus Scan API. The /scan/file/advanced
 * endpoint also detects script-embedded payloads (PDF JavaScript,
 * macro-enabled documents), not just classical signatures.
 *
 * Setup:
 *   - Register at https://www.cloudmersive.com (free tier 800/month)
 *   - Account → API Keys → copy key
 *   - Set CLOUDMERSIVE_API_KEY in .env.local (dev) and Vercel
 *     Production + Preview environments
 *
 * ISO 27001 A.8.7 (Protection against malware). Audit-logged via
 * recordAuditLog() for forensic traceability.
 */

import * as Sentry from "@sentry/nextjs";
import { getSupabaseAdmin } from "@/lib/supabase";
import { recordAuditLog } from "@/lib/audit";

/**
 * The Supabase bucket where all client uploads live. Single bucket
 * with sub-prefixes per surface (`{orderId}/`, `inquiries/`,
 * `ai-studio/`). Centralized here so file-scan callers and
 * deleteStorageObject share one source of truth.
 */
export const UPLOADS_BUCKET = "order-files";

const CLOUDMERSIVE_ENDPOINT =
  "https://api.cloudmersive.com/virus/scan/file/advanced";
const SCAN_TIMEOUT_MS = 30_000;

export class FileScanUnavailableError extends Error {
  constructor(reason: string) {
    super(`Antivirus scan unavailable: ${reason}`);
    this.name = "FileScanUnavailableError";
  }
}

export type ScanResult =
  | { clean: true; threats: []; engine: "cloudmersive" }
  | { clean: false; threats: string[]; engine: "cloudmersive" };

type CloudmersiveResponse = {
  CleanResult: boolean;
  ContainsExecutable?: boolean;
  ContainsInvalidFile?: boolean;
  ContainsScript?: boolean;
  ContainsPasswordProtectedFile?: boolean;
  ContainsRestrictedFileFormat?: boolean;
  ContainsMacros?: boolean;
  ContainsXmlExternalEntities?: boolean;
  ContainsInsecureDeserialization?: boolean;
  ContainsHtml?: boolean;
  VerifiedFileFormat?: string | null;
  FoundViruses?: Array<{ FileName?: string; VirusName?: string }>;
};

/**
 * Download the file from Supabase Storage and scan it via Cloudmersive.
 * Throws FileScanUnavailableError on transient failures (network,
 * timeout, 5xx after one retry, missing API key) — caller decides
 * whether to fail-closed or surface a friendly retry message.
 *
 * Returns a discriminated result; the caller branches on `clean`.
 */
export async function scanStorageObject(input: {
  bucket: string;
  path: string;
}): Promise<ScanResult> {
  const apiKey = process.env.CLOUDMERSIVE_API_KEY;
  if (!apiKey) {
    throw new FileScanUnavailableError("CLOUDMERSIVE_API_KEY not configured");
  }

  const supabase = getSupabaseAdmin();
  const download = await supabase.storage.from(input.bucket).download(input.path);
  if (download.error || !download.data) {
    throw new FileScanUnavailableError(
      `Supabase download failed: ${download.error?.message ?? "no data"}`,
    );
  }

  // Cloudmersive accepts the raw file body. Posting as a Blob keeps
  // the Content-Type that Supabase returned.
  const fileBlob = download.data;

  let response: Response | null = null;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);
    try {
      response = await fetch(CLOUDMERSIVE_ENDPOINT, {
        method: "POST",
        headers: {
          Apikey: apiKey,
          // Tell the engine to flag scripts/macros even if no signature
          // matches — mostly relevant for PDFs and Office files.
          allowExecutables: "false",
          allowInvalidFiles: "false",
          allowScripts: "false",
          allowPasswordProtectedFiles: "false",
          allowMacros: "false",
          allowXmlExternalEntities: "false",
          allowInsecureDeserialization: "false",
          allowHtml: "true",
        },
        body: fileBlob,
        signal: controller.signal,
      });
      if (response.status >= 500) {
        lastErr = new Error(`Cloudmersive ${response.status}`);
        if (attempt === 0) continue;
      }
      break;
    } catch (err) {
      lastErr = err;
      if (attempt === 0) continue;
    } finally {
      clearTimeout(timer);
    }
  }

  if (!response || !response.ok) {
    throw new FileScanUnavailableError(
      lastErr instanceof Error ? lastErr.message : String(lastErr ?? "unknown"),
    );
  }

  const body = (await response.json()) as CloudmersiveResponse;

  if (body.CleanResult === true) {
    return { clean: true, threats: [], engine: "cloudmersive" };
  }

  // Build a human-readable threat list. CleanResult=false can mean
  // signature match, embedded script/macro, or restricted format —
  // include them all so the audit log is forensically useful.
  const threats: string[] = [];
  if (body.FoundViruses?.length) {
    for (const v of body.FoundViruses) {
      if (v.VirusName) threats.push(`virus:${v.VirusName}`);
    }
  }
  if (body.ContainsExecutable) threats.push("executable");
  if (body.ContainsScript) threats.push("script");
  if (body.ContainsMacros) threats.push("macro");
  if (body.ContainsPasswordProtectedFile) threats.push("password-protected");
  if (body.ContainsXmlExternalEntities) threats.push("xxe");
  if (body.ContainsInsecureDeserialization) threats.push("deserialization");
  if (body.ContainsRestrictedFileFormat) threats.push("restricted-format");
  if (body.ContainsInvalidFile) threats.push("invalid-format");

  if (threats.length === 0) {
    // CleanResult=false with no specific flag — treat as a generic
    // failure rather than silently passing.
    threats.push("unspecified");
  }

  return { clean: false, threats, engine: "cloudmersive" };
}

/**
 * Best-effort Supabase delete used by callers that want to quarantine
 * an infected upload. Errors are logged but don't throw — the caller
 * has already decided to refuse the upload, and a Supabase delete
 * failure shouldn't escalate into a user-visible error.
 */
export async function deleteStorageObject(input: {
  bucket: string;
  path: string;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from(input.bucket)
      .remove([input.path]);
    if (error) {
      Sentry.captureException(error, {
        tags: { area: "file-scan", flow: "quarantine-delete" },
        extra: { bucket: input.bucket, path: input.path },
      });
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "file-scan", flow: "quarantine-delete" },
      extra: { bucket: input.bucket, path: input.path },
    });
  }
}

/**
 * High-level wrapper for the three upload-confirm server actions.
 *
 * Scans the Supabase object, records an audit log entry, and on
 * infected/scan-error deletes the object from storage. Returns a
 * discriminated result so callers can branch with one if-statement
 * instead of repeating the try/catch + delete + audit dance.
 *
 * Caller-provided `entityType` / `entityId` flow into the audit log
 * so reviewers in /portal/admin/revisions can pivot from a scan event
 * back to the order or inquiry it belonged to. The `entityId` can be
 * a synthetic value (e.g. "draft" for pre-order uploads) — the audit
 * log doesn't enforce it being a real FK.
 */
export type EnforceCleanScanResult =
  | { ok: true; scanStatus: "clean" | "pending" }
  | { ok: false; userError: string; reason: "infected" | "scan_error"; threats: string[] };

export async function enforceCleanScan(input: {
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  entityType: string;
  entityId: string;
  bucket?: string;
  // Šta raditi kad skener NIJE DOSTUPAN (za razliku od zaraženog fajla).
  //  - "reject" (podrazumevano): obriši fajl i vrati grešku. Zadržava
  //    postojeće ponašanje checkout/order upload-a — fail-closed.
  //  - "quarantine": ZADRŽI fajl, označi ga kao "pending" i pusti pozivaoca
  //    da nastavi. Koristi ga tok upita da lead ne bi tiho nestao kad je
  //    Cloudmersive privremeno nedostupan (incident 2026-06-24).
  // Zaražen fajl se UVEK odbija, bez obzira na ovu opciju.
  onScanUnavailable?: "reject" | "quarantine";
}): Promise<EnforceCleanScanResult> {
  const bucket = input.bucket ?? UPLOADS_BUCKET;
  const onScanUnavailable = input.onScanUnavailable ?? "reject";
  try {
    const result = await scanStorageObject({ bucket, path: input.storagePath });
    if (result.clean) {
      await recordAuditLog({
        action: "file.scan_clean",
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: {
          storagePath: input.storagePath,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
        },
      });
      return { ok: true, scanStatus: "clean" };
    }

    await deleteStorageObject({ bucket, path: input.storagePath });
    await recordAuditLog({
      action: "file.scan_infected",
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: {
        storagePath: input.storagePath,
        fileName: input.fileName,
        mimeType: input.mimeType,
        threats: result.threats,
      },
    });
    return {
      ok: false,
      reason: "infected",
      threats: result.threats,
      userError:
        "Fajl je odbijen jer je antivirus skener pronašao potencijalne pretnje. Ako verujete da je ovo greška, javite nam se na kontakt@elegantrender.rs.",
    };
  } catch (err) {
    if (err instanceof FileScanUnavailableError) {
      const quarantine = onScanUnavailable === "quarantine";
      // Karantin zadržava fajl; "reject" ga briše (staro ponašanje).
      if (!quarantine) {
        await deleteStorageObject({ bucket, path: input.storagePath });
      }
      Sentry.captureException(err, {
        tags: {
          area: "file-scan",
          flow: "enforce-clean-scan",
          outcome: quarantine ? "quarantined" : "rejected",
        },
        extra: {
          entityType: input.entityType,
          entityId: input.entityId,
          storagePath: input.storagePath,
        },
      });
      await recordAuditLog({
        action: "file.scan_error",
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: {
          storagePath: input.storagePath,
          errorReason: err.message,
          quarantined: quarantine,
        },
      });
      if (quarantine) {
        return { ok: true, scanStatus: "pending" };
      }
      return {
        ok: false,
        reason: "scan_error",
        threats: [],
        userError:
          "Trenutno ne možemo da proverimo fajl. Pokušajte ponovo za par minuta.",
      };
    }
    throw err;
  }
}
