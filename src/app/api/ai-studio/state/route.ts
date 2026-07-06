import { NextResponse } from "next/server";
import { getAiStudioState } from "@/server/actions/ai-studio";

export async function GET() {
  const state = await getAiStudioState();
  return NextResponse.json(state, {
    status: "error" in state && state.error === "You are not signed in." ? 401 : 200,
  });
}
