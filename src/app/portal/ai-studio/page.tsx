import type { Metadata } from "next";
import { getAiStudioState } from "@/server/actions/ai-studio";
import { AiStudioWorkspace } from "./workspace";

export const metadata: Metadata = {
  title: "AI Studio",
  robots: { index: false, follow: false },
};

export default async function AiStudioPage() {
  const state = await getAiStudioState();

  return <AiStudioWorkspace initialState={state} />;
}
