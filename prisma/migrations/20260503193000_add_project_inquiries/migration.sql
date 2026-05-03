-- General pre-sales inquiries submitted from the marketing site.
CREATE TYPE "ProjectInquiryStatus" AS ENUM (
  'pending',
  'in_progress',
  'proposal_sent',
  'converted',
  'closed'
);

CREATE TABLE "project_inquiries" (
  "id" TEXT NOT NULL,
  "source" TEXT,
  "sourcePath" TEXT,
  "sourceLabel" TEXT,
  "contactName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "company" TEXT,
  "serviceType" TEXT,
  "budget" TEXT,
  "deadline" TEXT,
  "message" TEXT NOT NULL,
  "quoteSnapshotJson" JSONB,
  "userId" TEXT,
  "status" "ProjectInquiryStatus" NOT NULL DEFAULT 'pending',
  "bitrixLeadId" TEXT,
  "bitrixSyncError" TEXT,
  "bitrixSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "reviewedAt" TIMESTAMP(3),

  CONSTRAINT "project_inquiries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_inquiry_files" (
  "id" TEXT NOT NULL,
  "inquiryId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "project_inquiry_files_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_inquiries_bitrixLeadId_key"
  ON "project_inquiries"("bitrixLeadId");

CREATE INDEX "project_inquiries_status_createdAt_idx"
  ON "project_inquiries"("status", "createdAt");

CREATE INDEX "project_inquiries_email_createdAt_idx"
  ON "project_inquiries"("email", "createdAt");

CREATE UNIQUE INDEX "project_inquiry_files_storagePath_key"
  ON "project_inquiry_files"("storagePath");

CREATE INDEX "project_inquiry_files_inquiryId_idx"
  ON "project_inquiry_files"("inquiryId");

ALTER TABLE "project_inquiries"
  ADD CONSTRAINT "project_inquiries_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "project_inquiry_files"
  ADD CONSTRAINT "project_inquiry_files_inquiryId_fkey"
  FOREIGN KEY ("inquiryId") REFERENCES "project_inquiries"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
