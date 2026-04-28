/**
 * POST /api/chat — AI chatbot endpoint using OpenAI GPT-4o-mini.
 *
 * Accepts conversation messages, streams the response back to the client.
 * Uses the system prompt with the full service catalog for recommendations.
 */

import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { SYSTEM_PROMPT } from "@/lib/chat/system-prompt";
import { detectChatFeedbackSignal } from "@/lib/chat/feedback";
import { prisma } from "@/lib/db";
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

  const { messages, pagePath, sessionId } = await request.json();
  const normalizedMessages = normalizeMessages(messages);

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
    console.error("[Chat] Feedback capture failed", error);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
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
