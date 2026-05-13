import { NextResponse } from "next/server";
import {
  prepareAiStudioReferences,
  type AiStudioPrepareReferencesInput,
} from "@/server/actions/ai-studio";

export async function POST(request: Request) {
  const input = (await request.json()) as AiStudioPrepareReferencesInput;
  const result = await prepareAiStudioReferences(input);

  return NextResponse.json(result, {
    status: result.error
      ? result.error === "Niste prijavljeni."
        ? 401
        : 400
      : 200,
  });
}
