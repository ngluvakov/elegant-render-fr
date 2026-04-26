import { NextResponse } from "next/server";
import { getAiStudioState } from "@/server/actions/ai-studio";

export async function GET() {
  const state = await getAiStudioState();
  return NextResponse.json(state, {
    status: "error" in state && state.error === "Niste prijavljeni." ? 401 : 200,
  });
}
