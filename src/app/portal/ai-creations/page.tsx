import type { Metadata } from "next";
import { listAiStudioGenerations } from "@/server/actions/ai-studio";
import { AiCreationsClient } from "./ai-creations-client";

export const metadata: Metadata = {
  title: "Créations IA",
  description:
    "Galerie de vos générations AI Studio avec les résultats, les statuts et les options pour poursuivre le travail.",
  robots: { index: false, follow: false },
};

export default async function AiCreationsPage() {
  const initialState = await listAiStudioGenerations({ limit: 24 });
  return <AiCreationsClient initialState={initialState} />;
}
