import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/tiff",
  "application/pdf",
];

export async function POST(request: Request) {
  const { orderId, fileName, mimeType, fileSize } = await request.json();

  if (!orderId || !fileName || !mimeType || !fileSize) {
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
      { error: "Nedozvoljeni tip fajla" },
      { status: 400 },
    );
  }

  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${orderId}/${Date.now()}-${sanitized}`;

  const { data, error } = await supabaseAdmin.storage
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
