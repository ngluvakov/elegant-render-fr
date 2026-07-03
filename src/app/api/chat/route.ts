/**
 * POST /api/chat — AI chatbot endpoint using OpenAI GPT-4o-mini.
 *
 * Accepts conversation messages, streams the response back to the client.
 * Uses the system prompt with the full service catalog for recommendations.
 */

import OpenAI from "openai";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { buildSystemPrompt } from "@/lib/chat/system-prompt";
import type { AssistantGuideContext } from "@/lib/chat/guide-context";
import { detectChatFeedbackSignal } from "@/lib/chat/feedback";
import { getDisplayCurrencyForCountry } from "@/lib/catalog/display-currency";
import { prisma } from "@/lib/db";
import { getPublishedPricingCatalog } from "@/server/pricing/catalog";
import {
  checkRateLimit,
  getRequestIdentifier,
  rateLimitMessage,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type IncomingChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

function normalizeMessages(messages: unknown): IncomingChatMessage[] | null {
  if (!Array.isArray(messages)) return null;

  const normalized = messages
    .map((message) => {
      if (!message || typeof message !== "object") return null;
      const candidate = message as Record<string, unknown>;
      const role = candidate.role;
      const content = cleanText(candidate.content, 4000);
      if ((role !== "user" && role !== "assistant") || !content) return null;
      return { role, content };
    })
    .filter((message): message is IncomingChatMessage => message !== null);

  return normalized.length > 0 ? normalized : null;
}

// Ranije golo `as` kastovanje — sadržaj ide u system prompt, pa oblik i
// dužine moraju biti ograničeni. Nepoznata polja se odbacuju (strip).
const guideContextSchema = z.object({
  page: z.enum([
    "ai_studio",
    "order_detail",
    "pricing",
    "service",
    "portfolio",
    "general",
  ]),
  stage: z
    .enum([
      "before_upload",
      "after_upload",
      "ready_to_generate",
      "has_result",
      "no_credits",
      "credit_purchase",
      "missing_order_data",
      "order_ready",
      "pricing_review",
      "service_detail",
      "portfolio_reference",
      "contact",
    ])
    .optional(),
  editType: z
    .enum([
      "item_removal",
      "day_to_dusk",
      "sky_replacement",
      "wall_color_change",
      "virtual_staging",
      "object_insertion",
      "virtual_renovation",
      "room_redesign",
    ])
    .optional(),
  productIds: z.array(z.string().max(100)).max(50).optional(),
  unconfiguredCount: z.number().int().min(0).max(1000).optional(),
  hasFiles: z.boolean().optional(),
  hasPrompt: z.boolean().optional(),
  balanceUnits: z.number().int().min(0).optional(),
  missingItems: z.array(z.string().max(300)).max(50).optional(),
  readinessWarnings: z.array(z.string().max(300)).max(50).optional(),
  canGenerate: z.boolean().optional(),
  cartItemCount: z.number().int().min(0).max(1000).optional(),
  cartTotalRsd: z.number().min(0).optional(),
  cartOriginalTotalRsd: z.number().min(0).optional(),
  cartHasDiscount: z.boolean().optional(),
});

function normalizeGuideContext(value: unknown): AssistantGuideContext | null {
  const parsed = guideContextSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

async function captureChatFeedback(args: {
  messages: IncomingChatMessage[];
  pagePath: unknown;
  sessionId: unknown;
}) {
  const latestUserMessage = [...args.messages]
    .reverse()
    .find((message) => message.role === "user");
  if (!latestUserMessage) return;

  const signal = detectChatFeedbackSignal(latestUserMessage.content);
  if (!signal) return;

  const session = await auth();
  await prisma.chatFeedback.create({
    data: {
      userId: session?.user?.id ?? null,
      sessionId: cleanText(args.sessionId, 120),
      pagePath: cleanText(args.pagePath, 240),
      category: signal.category,
      messageExcerpt: latestUserMessage.content.slice(0, 280),
      body: latestUserMessage.content,
      conversationJson: args.messages.slice(-8),
    },
  });
}

export async function POST(request: Request) {
  // Rate-limit before any OpenAI call so a botted /api/chat can't run
  // up the OpenAI bill. 30/h per IP — normal conversations stay well
  // under this; bot floods get cut off.
  const limit = await checkRateLimit("chat", getRequestIdentifier(request));
  if (!limit.ok) {
    return new Response(rateLimitMessage(limit.retryAfterSeconds), {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfterSeconds) },
    });
  }

  let payload: Record<string, unknown>;
  try {
    const raw: unknown = await request.json();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return new Response("Missing messages", { status: 400 });
    }
    payload = raw as Record<string, unknown>;
  } catch {
    return new Response("Missing messages", { status: 400 });
  }
  const { messages, pagePath, sessionId, guideContext } = payload;
  // Poslednjih 40 poruka je dovoljno konteksta; bez limita bi zlonameran
  // klijent mogao da naduva token potrošnju po zahtevu.
  const normalizedMessages = normalizeMessages(messages)?.slice(-40) ?? null;
  const pagePathText = cleanText(pagePath, 240);
  const assistantGuideContext = normalizeGuideContext(guideContext);

  if (!normalizedMessages) {
    return new Response("Missing messages", { status: 400 });
  }

  try {
    await captureChatFeedback({
      messages: normalizedMessages,
      pagePath,
      sessionId,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { area: "chat", flow: "feedback-capture" },
    });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const displayCurrency = getDisplayCurrencyForCountry(
    request.headers.get("x-vercel-ip-country"),
  );
  const pricingCatalog = await getPublishedPricingCatalog();
  const systemPrompt = buildSystemPrompt({
    displayCurrency,
    pricingSettings: pricingCatalog.settings,
    categories: pricingCatalog.categories,
    pagePath: pagePathText,
    guideContext: assistantGuideContext,
  });

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...normalizedMessages.slice(-20), // Keep last 20 messages for context
    ],
    stream: true,
    max_tokens: 500,
    temperature: 0.7,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
