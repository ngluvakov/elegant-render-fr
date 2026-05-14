import { after, NextResponse } from "next/server";
import {
  listAiStudioGenerations,
  processAiStudioGenerationJob,
  startAiStudioGeneration,
  type AiStudioGenerateInput,
  type AiGenerationStatusValue,
} from "@/server/actions/ai-studio";
import type { AiEditType } from "@/lib/ai-studio/catalog";

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
      ? result.error === "Niste prijavljeni."
        ? 401
        : 400
      : 200,
  });
}

export async function POST(request: Request) {
  const input = (await request.json()) as AiStudioGenerateInput;
  const result = await startAiStudioGeneration(input);

  if (result.generationId && !result.error) {
    after(() => processAiStudioGenerationJob(result.generationId!));
  }

  return NextResponse.json(result, {
    status: result.error
      ? result.error === "Niste prijavljeni."
        ? 401
        : 400
      : 202,
  });
}
