-- CreateTable
CREATE TABLE "chat_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "pagePath" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "messageExcerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "conversationJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_feedback_createdAt_idx" ON "chat_feedback"("createdAt");

-- CreateIndex
CREATE INDEX "chat_feedback_category_createdAt_idx" ON "chat_feedback"("category", "createdAt");

-- CreateIndex
CREATE INDEX "chat_feedback_userId_createdAt_idx" ON "chat_feedback"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "chat_feedback" ADD CONSTRAINT "chat_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
