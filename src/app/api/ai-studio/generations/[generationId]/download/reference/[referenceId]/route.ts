/**
 * Download endpoint for one reference object angle used by object insertion.
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
  params: Promise<{ generationId: string; referenceId: string }>;
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

  const { generationId, referenceId } = await params;
  const reference = await prisma.aiGenerationReferenceImage.findFirst({
    where: {
      id: referenceId,
      generationId,
      ...(canViewAllGenerations ? {} : { generation: { userId } }),
    },
    select: {
      id: true,
      storagePath: true,
      mimeType: true,
      fileName: true,
      generation: {
        select: {
          id: true,
          expiresAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!reference) {
    return NextResponse.json(
      { error: "Image de référence introuvable." },
      { status: 404 },
    );
  }
  if (reference.generation.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Le fichier a expiré." }, { status: 410 });
  }

  const { data, error } = await getSupabaseAdmin().storage
    .from("order-files")
    .download(reference.storagePath);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "File not found." },
      { status: 404 },
    );
  }

  const mimeType = reference.mimeType ?? data.type ?? "image/jpeg";
  const fileName =
    reference.fileName ??
    fallbackDownloadName({
      generationId: `${reference.generation.id}-reference-${reference.id}`,
      createdAt: reference.generation.createdAt,
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
