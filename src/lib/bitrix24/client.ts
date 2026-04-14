// Bitrix24 REST API client via inbound webhook
// Rate limited to 2 req/sec, with retry and sync logging

import { prisma } from "@/lib/db";

const WEBHOOK_URL = process.env.BITRIX24_WEBHOOK_URL!;

let lastCallTime = 0;

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < 500) {
    await new Promise((r) => setTimeout(r, 500 - elapsed));
  }
  lastCallTime = Date.now();
}

export async function bitrixCall<T = unknown>(
  method: string,
  params: Record<string, unknown> = {},
  meta?: { entityType: string; entityId: string; direction: "outbound" | "inbound" },
): Promise<T> {
  await rateLimit();

  const url = `${WEBHOOK_URL}${method}`;

  let response: Response;
  let retries = 0;

  while (true) {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (response.status === 429 || response.status === 503) {
      retries++;
      if (retries > 3) break;
      await new Promise((r) => setTimeout(r, 1000 * retries));
      continue;
    }

    break;
  }

  const body = await response.json();

  // Log to BitrixSyncLog
  if (meta) {
    await prisma.bitrixSyncLog.create({
      data: {
        entityType: meta.entityType,
        entityId: meta.entityId,
        direction: meta.direction,
        method,
        bitrixId: body.result?.toString() ?? null,
        success: !body.error,
        error: body.error ? JSON.stringify(body.error) : null,
      },
    }).catch(() => {}); // Don't fail on log errors
  }

  if (body.error) {
    throw new Error(
      `Bitrix24 ${method} failed: ${JSON.stringify(body.error)}`,
    );
  }

  return body.result as T;
}
