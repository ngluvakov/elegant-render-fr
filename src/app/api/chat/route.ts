/**
 * POST /api/chat — AI chatbot endpoint using OpenAI GPT-4o-mini.
 *
 * Accepts conversation messages, streams the response back to the client.
 * Uses the system prompt with the full service catalog for recommendations.
 */

import OpenAI from "openai";
import { SYSTEM_PROMPT } from "@/lib/chat/system-prompt";
import {
  checkRateLimit,
  getRequestIdentifier,
  rateLimitMessage,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

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

  const { messages } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response("Missing messages", { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-20), // Keep last 20 messages for context
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
