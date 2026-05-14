import { after, NextResponse } from "next/server";
import {
  deleteAiStudioGeneration,
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

export async function DELETE(
  _request: Request,
  { params }: GenerationRouteContext,
) {
  const { generationId } = await params;
  const result = await deleteAiStudioGeneration(generationId);

  return NextResponse.json(result, {
    status: result.error
      ? result.error === "Niste prijavljeni."
        ? 401
        : result.error === "AI obrada nije pronađena."
          ? 404
          : 400
      : 200,
  });
}
