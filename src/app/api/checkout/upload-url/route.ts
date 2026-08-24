import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  checkRateLimit,
  getRequestIdentifier,
  rateLimitMessage,
} from "@/lib/rate-limit";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/tiff",
  "application/pdf",
];

export async function POST(request: Request) {
  // Rate-limit BEFORE issuing presigned URLs. Without this, anyone with
  // a known orderId could request 1000s of upload URLs per minute and
  // spam Supabase storage with garbage.
  const limit = await checkRateLimit("uploadUrl", getRequestIdentifier(request));
  if (!limit.ok) {
    return NextResponse.json(
      { error: rateLimitMessage(limit.retryAfterSeconds) },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const { orderId, fileName, mimeType, fileSize } = await request.json();

  if (!orderId || !fileName || !mimeType || !fileSize) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  if (fileSize > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Le fichier est trop volumineux (50 Mo max)." },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.includes(mimeType)) {
    return NextResponse.json(
      { error: "Type de fichier non autorisé." },
      { status: 400 },
    );
  }

  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${orderId}/${Date.now()}-${sanitized}`;

  const { data, error } = await getSupabaseAdmin().storage
    .from("order-files")
    .createSignedUploadUrl(storagePath);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    storagePath,
    token: data.token,
  });
}
