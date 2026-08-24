import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  PROJECT_INQUIRY_MAX_FILE_BYTES,
  isAllowedProjectInquiryMimeType,
} from "@/lib/project-inquiry";
import {
  checkRateLimit,
  getRequestIdentifier,
  rateLimitMessage,
} from "@/lib/rate-limit";

function validDraftId(draftId: string): boolean {
  return /^[a-zA-Z0-9_-]{8,80}$/.test(draftId);
}

export async function POST(request: Request) {
  const limit = await checkRateLimit("uploadUrl", getRequestIdentifier(request));
  if (!limit.ok) {
    return NextResponse.json(
      { error: rateLimitMessage(limit.retryAfterSeconds) },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  const { draftId, fileName, mimeType, fileSize } = await request.json();

  if (!draftId || !fileName || !mimeType || !fileSize) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  const safeDraftId = String(draftId);
  if (!validDraftId(safeDraftId)) {
    return NextResponse.json({ error: "Invalid inquiry draft" }, { status: 400 });
  }

  const size = Number(fileSize);
  if (!Number.isFinite(size) || size <= 0 || size > PROJECT_INQUIRY_MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "Le fichier est trop volumineux (50 Mo max)." },
      { status: 400 },
    );
  }

  const type = String(mimeType);
  if (!isAllowedProjectInquiryMimeType(type)) {
    return NextResponse.json(
      { error: "Allowed file types are JPG, PNG, WebP, TIFF, and PDF." },
      { status: 400 },
    );
  }

  const sanitized = String(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `inquiries/${safeDraftId}/${crypto.randomUUID()}-${sanitized}`;

  const { data, error } = await getSupabaseAdmin().storage
    .from("order-files")
    .createSignedUploadUrl(storagePath);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    storagePath,
    token: data.token,
  });
}
