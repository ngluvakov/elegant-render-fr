/**
 * db.ts — Prisma client singleton (PrismaPg adapter over DATABASE_URL).
 *
 * Exports `prisma` — the single PrismaClient instance reused across hot
 * reloads in development via globalThis caching.
 *
 * Used by: nearly every server-side file (actions, bitrix sync, status
 *          machine, bitrix24 client, portal pages, API routes)
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient() {
  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
