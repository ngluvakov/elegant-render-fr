import type { Metadata } from "next";
import { listAiStudioGenerations } from "@/server/actions/ai-studio";
import { AiCreationsClient } from "./ai-creations-client";

export const metadata: Metadata = {
  title: "AI creations",
  description:
    "Gallery of your AI Studio generations with results, statuses, and options to continue work.",
  robots: { index: false, follow: false },
};

export default async function AiCreationsPage() {
  const initialState = await listAiStudioGenerations({ limit: 24 });
  return <AiCreationsClient initialState={initialState} />;
}
