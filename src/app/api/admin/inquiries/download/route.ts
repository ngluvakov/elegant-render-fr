import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    await requirePermission("INQUIRIES_MANAGE");
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");
  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  const file = await prisma.projectInquiryFile.findUnique({
    where: { id: fileId },
    select: { storagePath: true },
  });
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await getSupabaseAdmin().storage
    .from("order-files")
    .createSignedUrl(file.storagePath, 3600);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
