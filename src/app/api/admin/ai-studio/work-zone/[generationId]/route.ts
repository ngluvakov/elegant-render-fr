import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  createObjectWorkZoneOverlay,
  getImageDimensions,
} from "@/lib/ai-studio/image-processing";
import { requireAdmin } from "@/server/actions/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ generationId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { generationId } = await params;
  const generation = await prisma.aiGeneration.findUnique({
    where: { id: generationId },
    select: {
      editType: true,
      maskStoragePath: true,
      optionsJson: true,
      expiresAt: true,
    },
  });

  if (
    !generation ||
    generation.editType !== "object_insertion" ||
    !generation.maskStoragePath ||
    generation.expiresAt <= new Date()
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await getSupabaseAdmin().storage
    .from("order-files")
    .download(generation.maskStoragePath);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Maska nije dostupna." },
      { status: 404 },
    );
  }

  const mask = Buffer.from(await data.arrayBuffer());
  const options = readObjectDebugOptions(generation.optionsJson);
  const overlay = await createObjectWorkZoneOverlay({
    mask,
    dims: await getImageDimensions(mask),
    maskInverted: options.maskInverted,
    mode: options.objectMode === "replace" ? "source_object" : "placement_guide",
    category: options.selectedOption,
  });

  return new NextResponse(new Uint8Array(overlay), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=300",
    },
  });
}

function readObjectDebugOptions(value: unknown): {
  selectedOption: string | null;
  maskInverted: boolean;
  objectMode: "insert" | "replace";
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { selectedOption: null, maskInverted: false, objectMode: "insert" };
  }
  const data = value as Record<string, unknown>;
  return {
    selectedOption:
      typeof data.selectedOption === "string" ? data.selectedOption : null,
    maskInverted: data.maskInverted === true,
    objectMode: data.objectMode === "replace" ? "replace" : "insert",
  };
}
