/**
 * Download endpoint for the INPUT image of an AiGeneration.
 *
 * Mirrors the result download endpoint but serves the file used as
 * input to this generation. For derivatives, that's the parent
 * generation's result image; for fresh uploads, it's the customer's
 * original photo. Filename comes from generation.inputFileName, with
 * the same `edit-YYYYMMDD-{shortId}` fallback for old rows.
 */
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
    return NextResponse.json({ error: "Vous n’êtes pas connecté." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, adminPermissions: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
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
      inputStoragePath: true,
      inputMimeType: true,
      inputFileName: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  if (!generation) {
    return NextResponse.json({ error: "Génération IA introuvable." }, { status: 404 });
  }
  if (generation.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Le fichier a expiré." }, { status: 410 });
  }

  const { data, error } = await getSupabaseAdmin().storage
    .from("order-files")
    .download(generation.inputStoragePath);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "File not found." },
      { status: 404 },
    );
  }

  const mimeType = generation.inputMimeType ?? data.type ?? "image/jpeg";
  const fileName =
    generation.inputFileName ??
    fallbackDownloadName({
      generationId: `${generation.id}-input`,
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
