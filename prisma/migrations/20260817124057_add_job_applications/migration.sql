-- CreateEnum
CREATE TYPE "JobApplicationStatus" AS ENUM ('new', 'reviewing', 'interview', 'rejected', 'hired');

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "linkedinUrl" TEXT,
    "portfolioUrl" TEXT,
    "position" TEXT NOT NULL,
    "employmentType" TEXT,
    "availableFrom" TEXT,
    "expectedSalary" TEXT,
    "experienceYears" TEXT,
    "education" TEXT,
    "coverLetter" TEXT NOT NULL,
    "software" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "softwareOther" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillsOther" TEXT,
    "status" "JobApplicationStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_application_files" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanStatus" TEXT,
    "scannedAt" TIMESTAMP(3),
    "scanThreats" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "job_application_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_applications_status_createdAt_idx" ON "job_applications"("status", "createdAt");

-- CreateIndex
CREATE INDEX "job_applications_email_createdAt_idx" ON "job_applications"("email", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "job_application_files_storagePath_key" ON "job_application_files"("storagePath");

-- CreateIndex
CREATE INDEX "job_application_files_applicationId_idx" ON "job_application_files"("applicationId");

-- AddForeignKey
ALTER TABLE "job_application_files" ADD CONSTRAINT "job_application_files_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

