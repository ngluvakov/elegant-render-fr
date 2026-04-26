import { after, NextResponse } from "next/server";
import {
  processAiStudioGenerationJob,
  startAiStudioGeneration,
  type AiStudioGenerateInput,
} from "@/server/actions/ai-studio";

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
