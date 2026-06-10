/**
 * AiStudioAssistantGuideContext — declares page "ai_studio" to the assistant
 * guide store on the public AI Studio landing page. This gives the assistant
 * page awareness there and lets the chat widget lift its FAB/bubble above the
 * always-present mobile credit dock (CreditBuyDockMobile, lg:hidden).
 *
 * Null-render. Used on: (marketing)/ai-studio/page.tsx
 */
"use client";

import { useAssistantGuideContext } from "@/lib/chat/guide-context";

export function AiStudioAssistantGuideContext() {
  useAssistantGuideContext({ page: "ai_studio" });
  return null;
}
