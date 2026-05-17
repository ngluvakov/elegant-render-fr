import type { Metadata } from "next";
import { listAiStudioGenerations } from "@/server/actions/ai-studio";
import { AiCreationsClient } from "./ai-creations-client";

export const metadata: Metadata = {
  title: "AI kreacije",
  description:
    "Galerija vaših AI Studio generacija sa rezultatima, statusima i opcijama za nastavak rada.",
  robots: { index: false, follow: false },
};

export default async function AiCreationsPage() {
  const initialState = await listAiStudioGenerations({ limit: 24 });
  return <AiCreationsClient initialState={initialState} />;
}
