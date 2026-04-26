import { after, NextResponse } from "next/server";
import {
  getAiStudioGenerationStatus,
  processAiStudioGenerationJob,
} from "@/server/actions/ai-studio";

type GenerationRouteContext = {
  params: Promise<{ generationId: string }>;
};

export async function GET(_request: Request, { params }: GenerationRouteContext) {
  const { generationId } = await params;
  const result = await getAiStudioGenerationStatus(generationId);

  if (
    result.generation?.status === "queued" ||
    result.generation?.status === "processing"
  ) {
    after(() => processAiStudioGenerationJob(generationId));
  }

  return NextResponse.json(result, {
    status: result.error
      ? result.error === "Niste prijavljeni."
        ? 401
        : 404
      : 200,
  });
}
