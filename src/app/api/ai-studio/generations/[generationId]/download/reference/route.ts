/**
 * Download endpoint for the reference object image used by object insertion.
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
      referenceStoragePath: true,
      referenceMimeType: true,
      referenceFileName: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  if (!generation?.referenceStoragePath) {
    return NextResponse.json(
      { error: "Image de référence introuvable." },
      { status: 404 },
    );
  }
  if (generation.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Le fichier a expiré." }, { status: 410 });
  }

  const { data, error } = await getSupabaseAdmin().storage
    .from("order-files")
    .download(generation.referenceStoragePath);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "File not found." },
      { status: 404 },
    );
  }

  const mimeType = generation.referenceMimeType ?? data.type ?? "image/jpeg";
  const fileName =
    generation.referenceFileName ??
    fallbackDownloadName({
      generationId: `${generation.id}-reference`,
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
