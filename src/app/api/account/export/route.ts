/**
 * GET /api/account/export — GDPR Art. 20 (data portability) download.
 *
 * Returns a JSON snapshot of all personal data tied to the current
 * user as a downloadable file. Auth-gated; rate-limited; audit-logged.
 *
 * The export covers: profile, orders + items + files (metadata, not
 * binary file contents — those are downloaded separately from the
 * portal), comments by the user, project inquiries, AI generations,
 * AI credit transactions, chat feedback. Anything tied to the user
 * via FK in the schema.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const limit = await checkRateLimit("accountExport", `user:${userId}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: rateLimitMessage(limit.retryAfterSeconds) },
      { status: 429 },
    );
  }

  const [user, orders, comments, inquiries, generations, creditTxns, feedback] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          emailVerified: true,
          isAdmin: true,
          aiCreditBalanceUnits: true,
          aiCreditsExpireAt: true,
          createdAt: true,
          updatedAt: true,
          deletionRequestedAt: true,
        },
      }),
      prisma.order.findMany({
        where: { userId },
        include: {
          items: true,
          files: {
            select: {
              id: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              kind: true,
              uploadedAt: true,
            },
          },
          statusEvents: {
            select: {
              fromStatus: true,
              toStatus: true,
              note: true,
              createdAt: true,
            },
          },
          charges: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.orderComment.findMany({
        where: { authorId: userId },
        select: {
          id: true,
          orderId: true,
          role: true,
          body: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.projectInquiry.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.aiGeneration.findMany({
        where: { userId },
        select: {
          id: true,
          editType: true,
          status: true,
          prompt: true,
          inputFileName: true,
          resultFileName: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.aiCreditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.chatFeedback.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await recordAuditLog({
    action: "account.export",
    entityType: "User",
    entityId: userId,
    metadata: {
      orderCount: orders.length,
      commentCount: comments.length,
      inquiryCount: inquiries.length,
      generationCount: generations.length,
    },
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    note: "Ce fichier contient une copie des données personnelles qu’Elegant Render traite pour votre compte. Vous trouverez plus d’informations dans la Politique de confidentialité (/legal/privacy).",
    profile: user,
    orders,
    comments,
    projectInquiries: inquiries,
    aiGenerations: generations,
    aiCreditTransactions: creditTxns,
    chatFeedback: feedback,
  };

  const filename = `elegant-render-data-${userId.slice(-8)}-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
