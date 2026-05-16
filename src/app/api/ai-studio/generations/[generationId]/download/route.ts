import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  contentDispositionFileName,
  fallbackDownloadName,
} from "@/lib/ai-studio/naming";
import {
  hasAdminPermission,
  normalizeAdminPermissions,
} from "@/lib/admin-permissions";

type DownloadRouteContext = {
  params: Promise<{ generationId: string }>;
};

export async function GET(_request: Request, { params }: DownloadRouteContext) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, adminPermissions: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Korisnik nije pronađen." }, { status: 404 });
  }

  const canViewAllGenerations = hasAdminPermission(
    normalizeAdminPermissions(user.adminPermissions, { isAdmin: user.isAdmin }),
    "USAGE_VIEW",
  );

  const { generationId } = await params;
  const generation = await prisma.aiGeneration.findFirst({
    where: {
      id: generationId,
      ...(canViewAllGenerations ? {} : { userId }),
    },
    select: {
      id: true,
      status: true,
      resultStoragePath: true,
      resultMimeType: true,
      resultFileName: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  if (!generation) {
    return NextResponse.json({ error: "AI obrada nije pronađena." }, { status: 404 });
  }
  if (generation.status !== "completed" || !generation.resultStoragePath) {
    return NextResponse.json({ error: "Rezultat još nije spreman." }, { status: 409 });
  }
  if (generation.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Fajl je istekao." }, { status: 410 });
  }

  const { data, error } = await getSupabaseAdmin().storage
    .from("order-files")
    .download(generation.resultStoragePath);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Fajl nije pronađen." },
      { status: 404 },
    );
  }

  const mimeType = generation.resultMimeType ?? data.type ?? "image/jpeg";
  const fileName =
    generation.resultFileName ??
    fallbackDownloadName({
      generationId: generation.id,
      createdAt: generation.createdAt,
      mimeType,
    });
  const bytes = await data.arrayBuffer();

  return new Response(bytes, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": contentDispositionFileName(fileName),
      "Cache-Control": "private, no-store",
    },
  });
}
