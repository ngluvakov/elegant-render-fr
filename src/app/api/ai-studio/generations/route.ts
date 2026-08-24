import { after, NextResponse } from "next/server";
import { z } from "zod";
import {
  listAiStudioGenerations,
  processAiStudioGenerationJob,
  startAiStudioGeneration,
  type AiStudioGenerateInput,
  type AiGenerationStatusValue,
} from "@/server/actions/ai-studio";
import type { AiEditType } from "@/lib/ai-studio/catalog";

// Schema mirrors AiStudioGenerateInput — the body used to be a bare `as` cast.
const generateInputSchema = z.object({
  editType: z.enum([
    "item_removal",
    "day_to_dusk",
    "sky_replacement",
    "wall_color_change",
    "virtual_staging",
    "object_insertion",
    "virtual_renovation",
    "room_redesign",
  ]),
  inputStoragePath: z.string().min(1).max(1024),
  inputMimeType: z.string().min(1).max(255),
  inputFileName: z.string().max(512).nullish(),
  referenceImages: z
    .array(
      z.object({
        storagePath: z.string().min(1).max(1024),
        mimeType: z.string().min(1).max(255),
        fileName: z.string().max(512).nullish(),
      }),
    )
    .max(10)
    .nullish(),
  referenceStoragePath: z.string().max(1024).nullish(),
  referenceMimeType: z.string().max(255).nullish(),
  referenceFileName: z.string().max(512).nullish(),
  maskStoragePath: z.string().max(1024).nullish(),
  maskInverted: z.boolean().optional(),
  objectMode: z.enum(["insert", "replace"]).nullish(),
  prompt: z.string().max(4000),
  styleId: z.string().max(200).nullish(),
  selectedOption: z.string().max(500).nullish(),
  colorHex: z.string().max(20).nullish(),
  parentGenerationId: z.string().max(100).nullish(),
  referenceGuidanceAcknowledged: z.boolean().nullish(),
}) satisfies z.ZodType<AiStudioGenerateInput>;

const VALID_STATUSES = new Set<AiGenerationStatusValue>([
  "queued",
  "processing",
  "completed",
  "failed",
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const editType = searchParams.get("editType");
  const limit = Number(searchParams.get("limit") ?? "24");
  const result = await listAiStudioGenerations({
    cursor: searchParams.get("cursor"),
    limit: Number.isFinite(limit) ? limit : 24,
    status:
      status && VALID_STATUSES.has(status as AiGenerationStatusValue)
        ? (status as AiGenerationStatusValue)
        : status === "all"
          ? "all"
          : null,
    editType:
      editType && editType !== "all" ? (editType as AiEditType) : "all",
  });

  return NextResponse.json(result, {
    status: result.error
      ? result.error === "Vous n’êtes pas connecté."
        ? 401
        : 400
      : 200,
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const parsed = generateInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const result = await startAiStudioGeneration(parsed.data);

  if (result.generationId && !result.error) {
    after(() => processAiStudioGenerationJob(result.generationId!));
  }

  return NextResponse.json(result, {
    status: result.error
      ? result.error === "Vous n’êtes pas connecté."
        ? 401
        : 400
      : 202,
  });
}
