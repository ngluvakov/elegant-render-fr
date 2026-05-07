import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }

  const { fileName, mimeType, fileSize, purpose } = await request.json();

  if (!fileName || !mimeType || !fileSize) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (fileSize > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Fajl je prevelik (max 50MB)" },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.includes(mimeType)) {
    return NextResponse.json(
      { error: "Dozvoljeni su JPG, PNG i WebP fajlovi." },
      { status: 400 },
    );
  }

  const sanitized = String(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const folder =
    purpose === "mask"
      ? "masks"
      : purpose === "reference"
        ? "references"
        : "inputs";
  const storagePath = `ai-studio/${userId}/${folder}/${crypto.randomUUID()}-${sanitized}`;

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
