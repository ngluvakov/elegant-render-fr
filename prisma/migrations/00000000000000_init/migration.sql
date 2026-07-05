-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AdminPermission" AS ENUM ('PROJECTS_VIEW', 'PROJECTS_MANAGE', 'INQUIRIES_MANAGE', 'FINANCE_VIEW', 'FINANCE_MANAGE', 'USERS_VIEW', 'USERS_MANAGE', 'AI_CREDITS_MANAGE', 'USAGE_VIEW', 'ANALYTICS_VIEW', 'AUDIT_VIEW', 'SYSTEM_MANAGE', 'ADMIN_MANAGE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('draft', 'awaiting_payment', 'paid', 'in_progress', 'in_review', 'revision_requested', 'delivered', 'closed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "BuyerType" AS ENUM ('individual', 'company_rs', 'company_foreign');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('card_mock', 'wire_transfer', 'nestpay');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('online_payment', 'wire_transfer');

-- CreateEnum
CREATE TYPE "BillingCurrency" AS ENUM ('RSD');

-- CreateEnum
CREATE TYPE "OrderItemKind" AS ENUM ('service', 'ai_credits');

-- CreateEnum
CREATE TYPE "OrderChargeStatus" AS ENUM ('pending', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "AiCreditTransactionType" AS ENUM ('purchase', 'spend', 'refund', 'expiry', 'adjustment');

-- CreateEnum
CREATE TYPE "AiGenerationStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "AiEditType" AS ENUM ('item_removal', 'day_to_dusk', 'sky_replacement', 'wall_color_change', 'virtual_staging', 'object_insertion', 'virtual_renovation', 'room_redesign');

-- CreateEnum
CREATE TYPE "AiImageProvider" AS ENUM ('gemini_flash', 'gemini_pro', 'openai');

-- CreateEnum
CREATE TYPE "ProjectInquiryStatus" AS ENUM ('pending', 'in_progress', 'proposal_sent', 'converted', 'closed');

-- CreateEnum
CREATE TYPE "PricingBookStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "VrInquiryStatus" AS ENUM ('pending', 'in_progress', 'converted', 'closed');

-- CreateEnum
CREATE TYPE "OutboxEventStatus" AS ENUM ('pending', 'running', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "OutboxEventType" AS ENUM ('order_confirmation_email', 'portal_access_email', 'vr_project_ready_email', 'ai_credits_expiry_reminder_email', 'ai_credits_granted_email', 'free_revision_granted_email', 'additional_charge_requested_email', 'additional_charge_paid_email', 'invoice_issued_email', 'proforma_issued_email', 'inquiry_converted_email', 'payment_success_email', 'payment_failure_email');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "phone" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "canManageFinance" BOOLEAN NOT NULL DEFAULT false,
    "adminPermissions" "AdminPermission"[] DEFAULT ARRAY[]::"AdminPermission"[],
    "lastActiveAt" TIMESTAMP(3),
    "bitrixContactId" TEXT,
    "aiCreditBalanceUnits" INTEGER NOT NULL DEFAULT 0,
    "aiCreditsExpireAt" TIMESTAMP(3),
    "aiCreditsReminder30SentAt" TIMESTAMP(3),
    "aiCreditsReminder7SentAt" TIMESTAMP(3),
    "billingBuyerType" "BuyerType" NOT NULL DEFAULT 'individual',
    "billingCountryCode" TEXT,
    "billingCompanyName" TEXT,
    "billingCompanyTaxId" TEXT,
    "billingCompanyMb" TEXT,
    "billingCompanyAddress" TEXT,
    "deletionRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_usage_daily" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "portalVisits" INTEGER NOT NULL DEFAULT 0,
    "ordersCreated" INTEGER NOT NULL DEFAULT 0,
    "aiGenerationsStarted" INTEGER NOT NULL DEFAULT 0,
    "aiCreditsSpentUnits" INTEGER NOT NULL DEFAULT 0,
    "aiCreditsGrantedUnits" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_usage_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectName" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'draft',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paymentProvider" "PaymentProvider",
    "paymentId" TEXT,
    "bitrix24DealId" TEXT,
    "totalRsd" INTEGER NOT NULL,
    "totalCents" INTEGER,
    "premiumTotalRsd" INTEGER,
    "containsAiCredits" BOOLEAN NOT NULL DEFAULT false,
    "aiCreditsAppliedAt" TIMESTAMP(3),
    "customerNote" TEXT,
    "withdrawalWaivedAt" TIMESTAMP(3),
    "buyerType" "BuyerType" NOT NULL DEFAULT 'individual',
    "buyerCountryCode" TEXT,
    "buyerAddress" TEXT,
    "buyerCity" TEXT,
    "buyerPhone" TEXT,
    "buyerPostalCode" TEXT,
    "companyName" TEXT,
    "companyTaxId" TEXT,
    "companyMb" TEXT,
    "companyAddress" TEXT,
    "companyCountryCode" TEXT,
    "billingCurrency" "BillingCurrency",
    "billingVatRate" DOUBLE PRECISION,
    "billingRsdRate" DOUBLE PRECISION,
    "billingTotalCents" INTEGER,
    "vatVerifiedAt" TIMESTAMP(3),
    "vatVerifiedName" TEXT,
    "vatRequestId" TEXT,
    "nestpayTransId" TEXT,
    "nestpayAuthCode" TEXT,
    "nestpayProcReturnCode" TEXT,
    "nestpayMdStatus" TEXT,
    "nestpayHostRefNum" TEXT,
    "nestpayExtraTrxDate" TIMESTAMP(3),
    "nestpayResponseRaw" JSONB,
    "nestpayResponseHash" TEXT,
    "nestpayLastQueryAt" TIMESTAMP(3),
    "nestpayChargedAmountCents" INTEGER,
    "nestpayChargedCurrency" TEXT,
    "nestpayChargeRate" DOUBLE PRECISION,
    "nestpayInstallmentCount" INTEGER,
    "invoiceNumber" TEXT,
    "invoiceIssuedAt" TIMESTAMP(3),
    "invoicePdfPath" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'online_payment',
    "proformaNumber" TEXT,
    "proformaIssuedAt" TIMESTAMP(3),
    "proformaPdfPath" TEXT,
    "referencedOrderId" TEXT,
    "sourceInquiryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "productLabel" TEXT NOT NULL,
    "categoryLabel" TEXT NOT NULL,
    "kind" "OrderItemKind" NOT NULL DEFAULT 'service',
    "basePriceRsd" INTEGER NOT NULL,
    "basePriceCents" INTEGER,
    "totalRsd" INTEGER NOT NULL,
    "totalCents" INTEGER,
    "aiCreditQuantity" INTEGER,
    "aiCreditUnits" INTEGER,
    "addOnsJson" JSONB NOT NULL,
    "durationSeconds" INTEGER,
    "durationDiscount" DOUBLE PRECISION,
    "clientNote" TEXT,
    "configJson" JSONB,
    "originalTotalRsd" INTEGER,
    "discountPct" INTEGER,
    "discountReason" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_files" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "floorId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'source',
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "bitrix24FileId" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanStatus" TEXT,
    "scannedAt" TIMESTAMP(3),
    "scanThreats" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "order_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_comments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'client',
    "body" TEXT NOT NULL,
    "bitrix24CommentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_charges" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reason" TEXT,
    "totalCents" INTEGER NOT NULL,
    "buyerType" "BuyerType",
    "buyerCountryCode" TEXT,
    "companyName" TEXT,
    "companyTaxId" TEXT,
    "companyMb" TEXT,
    "companyAddress" TEXT,
    "companyCountryCode" TEXT,
    "billingCurrency" "BillingCurrency",
    "billingVatRate" DOUBLE PRECISION,
    "billingRsdRate" DOUBLE PRECISION,
    "billingTotalCents" INTEGER,
    "status" "OrderChargeStatus" NOT NULL DEFAULT 'pending',
    "paymentProvider" "PaymentProvider",
    "paymentId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "nestpayTransId" TEXT,
    "nestpayAuthCode" TEXT,
    "nestpayProcReturnCode" TEXT,
    "nestpayMdStatus" TEXT,
    "nestpayHostRefNum" TEXT,
    "nestpayExtraTrxDate" TIMESTAMP(3),
    "nestpayResponseRaw" JSONB,
    "nestpayResponseHash" TEXT,
    "nestpayLastQueryAt" TIMESTAMP(3),
    "nestpayChargedAmountCents" INTEGER,
    "nestpayChargedCurrency" TEXT,
    "nestpayChargeRate" DOUBLE PRECISION,
    "invoiceNumber" TEXT,
    "invoiceIssuedAt" TIMESTAMP(3),
    "invoicePdfPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "order_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_charge_items" (
    "id" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "productId" TEXT,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "configJson" JSONB,

    CONSTRAINT "order_charge_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitrix_sync_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "payloadHash" TEXT,
    "bitrixId" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitrix_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "itemsJson" JSONB NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "openedAt" TIMESTAMP(3),

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_credit_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "generationId" TEXT,
    "type" "AiCreditTransactionType" NOT NULL,
    "units" INTEGER NOT NULL,
    "balanceAfterUnits" INTEGER NOT NULL,
    "amountCents" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentGenerationId" TEXT,
    "paidGenerationId" TEXT,
    "editType" "AiEditType" NOT NULL,
    "provider" "AiImageProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "styleId" TEXT,
    "optionsJson" JSONB,
    "status" "AiGenerationStatus" NOT NULL DEFAULT 'queued',
    "inputStoragePath" TEXT NOT NULL,
    "inputMimeType" TEXT NOT NULL,
    "maskStoragePath" TEXT,
    "referenceStoragePath" TEXT,
    "referenceMimeType" TEXT,
    "referenceFileName" TEXT,
    "resultStoragePath" TEXT,
    "resultMimeType" TEXT,
    "rootFileName" TEXT,
    "inputFileName" TEXT,
    "resultFileName" TEXT,
    "unitsCharged" INTEGER NOT NULL,
    "coveredUnits" INTEGER NOT NULL,
    "freeAttemptIndex" INTEGER,
    "errorMessage" TEXT,
    "providerResponseId" TEXT,
    "providerOutputStoragePath" TEXT,
    "providerOutputMimeType" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "processingLockUntil" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generation_reference_images" (
    "id" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generation_reference_images_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
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

-- CreateTable
CREATE TABLE "project_inquiry_files" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanStatus" TEXT,
    "scannedAt" TIMESTAMP(3),
    "scanThreats" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "project_inquiry_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_books" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "PricingBookStatus" NOT NULL DEFAULT 'draft',
    "catalogJson" JSONB NOT NULL,
    "settingsJson" JSONB NOT NULL,
    "createdById" TEXT,
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_products" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unitLabel" TEXT NOT NULL,
    "basePriceRsd" DOUBLE PRECISION NOT NULL,
    "includesJson" JSONB NOT NULL,
    "inquiryOnly" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_add_ons" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "addOnId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceRsd" DOUBLE PRECISION NOT NULL,
    "priceType" TEXT NOT NULL,
    "includedQty" INTEGER NOT NULL,
    "maxQty" INTEGER,
    "volumeRulesJson" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_add_ons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_discount_rules" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "requires" TEXT NOT NULL,
    "discountPct" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "conditionJson" JSONB,
    "sourceProductsJson" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_discount_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_duration_rules" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sourceMode" TEXT,
    "minSeconds" INTEGER NOT NULL,
    "defaultSeconds" INTEGER NOT NULL,
    "maxSeconds" INTEGER,
    "perSecondRsd" DOUBLE PRECISION NOT NULL,
    "discountTiersJson" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_duration_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_settings" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_change_logs" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "detailsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_counters" (
    "year" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_counters_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "proforma_counters" (
    "year" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proforma_counters_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "type" "OutboxEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "OutboxEventStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "succeededAt" TIMESTAMP(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vr_inquiries" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "configJson" JSONB NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "userId" TEXT,
    "status" "VrInquiryStatus" NOT NULL DEFAULT 'pending',
    "convertedOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "vr_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_bitrixContactId_key" ON "users"("bitrixContactId");

-- CreateIndex
CREATE INDEX "user_usage_daily_day_idx" ON "user_usage_daily"("day");

-- CreateIndex
CREATE UNIQUE INDEX "user_usage_daily_userId_day_key" ON "user_usage_daily"("userId", "day");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "orders_bitrix24DealId_key" ON "orders"("bitrix24DealId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_invoiceNumber_key" ON "orders"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "orders_proformaNumber_key" ON "orders"("proformaNumber");

-- CreateIndex
CREATE INDEX "orders_sourceInquiryId_idx" ON "orders"("sourceInquiryId");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_paymentId_paymentProvider_idx" ON "orders"("paymentId", "paymentProvider");

-- CreateIndex
CREATE INDEX "orders_paymentStatus_idx" ON "orders"("paymentStatus");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_files_orderId_idx" ON "order_files"("orderId");

-- CreateIndex
CREATE INDEX "order_files_orderItemId_idx" ON "order_files"("orderItemId");

-- CreateIndex
CREATE INDEX "order_status_events_orderId_createdAt_idx" ON "order_status_events"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "order_comments_bitrix24CommentId_key" ON "order_comments"("bitrix24CommentId");

-- CreateIndex
CREATE INDEX "order_comments_orderId_createdAt_idx" ON "order_comments"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "order_charges_invoiceNumber_key" ON "order_charges"("invoiceNumber");

-- CreateIndex
CREATE INDEX "order_charges_orderId_status_idx" ON "order_charges"("orderId", "status");

-- CreateIndex
CREATE INDEX "order_charge_items_chargeId_idx" ON "order_charge_items"("chargeId");

-- CreateIndex
CREATE INDEX "bitrix_sync_logs_entityType_entityId_idx" ON "bitrix_sync_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "bitrix_sync_logs_direction_createdAt_idx" ON "bitrix_sync_logs"("direction", "createdAt");

-- CreateIndex
CREATE INDEX "quotes_expiresAt_idx" ON "quotes"("expiresAt");

-- CreateIndex
CREATE INDEX "quotes_userId_idx" ON "quotes"("userId");

-- CreateIndex
CREATE INDEX "ai_credit_transactions_userId_createdAt_idx" ON "ai_credit_transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_credit_transactions_orderId_idx" ON "ai_credit_transactions"("orderId");

-- CreateIndex
CREATE INDEX "ai_credit_transactions_generationId_idx" ON "ai_credit_transactions"("generationId");

-- CreateIndex
CREATE INDEX "ai_generations_userId_createdAt_idx" ON "ai_generations"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_generations_expiresAt_idx" ON "ai_generations"("expiresAt");

-- CreateIndex
CREATE INDEX "ai_generations_status_createdAt_idx" ON "ai_generations"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ai_generations_paidGenerationId_idx" ON "ai_generations"("paidGenerationId");

-- CreateIndex
CREATE INDEX "ai_generations_processingLockUntil_idx" ON "ai_generations"("processingLockUntil");

-- CreateIndex
CREATE UNIQUE INDEX "ai_generations_paidGenerationId_freeAttemptIndex_key" ON "ai_generations"("paidGenerationId", "freeAttemptIndex");

-- CreateIndex
CREATE INDEX "ai_generation_reference_images_storagePath_idx" ON "ai_generation_reference_images"("storagePath");

-- CreateIndex
CREATE UNIQUE INDEX "ai_generation_reference_images_generationId_sortOrder_key" ON "ai_generation_reference_images"("generationId", "sortOrder");

-- CreateIndex
CREATE INDEX "chat_feedback_createdAt_idx" ON "chat_feedback"("createdAt");

-- CreateIndex
CREATE INDEX "chat_feedback_category_createdAt_idx" ON "chat_feedback"("category", "createdAt");

-- CreateIndex
CREATE INDEX "chat_feedback_userId_createdAt_idx" ON "chat_feedback"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "project_inquiries_bitrixLeadId_key" ON "project_inquiries"("bitrixLeadId");

-- CreateIndex
CREATE INDEX "project_inquiries_status_createdAt_idx" ON "project_inquiries"("status", "createdAt");

-- CreateIndex
CREATE INDEX "project_inquiries_email_createdAt_idx" ON "project_inquiries"("email", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "project_inquiry_files_storagePath_key" ON "project_inquiry_files"("storagePath");

-- CreateIndex
CREATE INDEX "project_inquiry_files_inquiryId_idx" ON "project_inquiry_files"("inquiryId");

-- CreateIndex
CREATE INDEX "pricing_books_status_publishedAt_idx" ON "pricing_books"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "pricing_products_bookId_categoryId_idx" ON "pricing_products"("bookId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_products_bookId_productId_key" ON "pricing_products"("bookId", "productId");

-- CreateIndex
CREATE INDEX "pricing_add_ons_bookId_productId_idx" ON "pricing_add_ons"("bookId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_add_ons_bookId_productId_addOnId_key" ON "pricing_add_ons"("bookId", "productId", "addOnId");

-- CreateIndex
CREATE INDEX "pricing_discount_rules_bookId_productId_idx" ON "pricing_discount_rules"("bookId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_discount_rules_bookId_ruleId_key" ON "pricing_discount_rules"("bookId", "ruleId");

-- CreateIndex
CREATE INDEX "pricing_duration_rules_bookId_productId_idx" ON "pricing_duration_rules"("bookId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_duration_rules_bookId_productId_sourceMode_key" ON "pricing_duration_rules"("bookId", "productId", "sourceMode");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_settings_bookId_key_key" ON "pricing_settings"("bookId", "key");

-- CreateIndex
CREATE INDEX "pricing_change_logs_bookId_createdAt_idx" ON "pricing_change_logs"("bookId", "createdAt");

-- CreateIndex
CREATE INDEX "pricing_change_logs_actorId_createdAt_idx" ON "pricing_change_logs"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_idempotencyKey_key" ON "outbox_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "outbox_events_status_nextAttemptAt_idx" ON "outbox_events"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "vr_inquiries_status_createdAt_idx" ON "vr_inquiries"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "user_usage_daily" ADD CONSTRAINT "user_usage_daily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_referencedOrderId_fkey" FOREIGN KEY ("referencedOrderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_sourceInquiryId_fkey" FOREIGN KEY ("sourceInquiryId") REFERENCES "project_inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_files" ADD CONSTRAINT "order_files_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_files" ADD CONSTRAINT "order_files_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_comments" ADD CONSTRAINT "order_comments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_comments" ADD CONSTRAINT "order_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_charges" ADD CONSTRAINT "order_charges_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_charges" ADD CONSTRAINT "order_charges_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_charge_items" ADD CONSTRAINT "order_charge_items_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "order_charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_credit_transactions" ADD CONSTRAINT "ai_credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generation_reference_images" ADD CONSTRAINT "ai_generation_reference_images_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "ai_generations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_feedback" ADD CONSTRAINT "chat_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_inquiries" ADD CONSTRAINT "project_inquiries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_inquiry_files" ADD CONSTRAINT "project_inquiry_files_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "project_inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_books" ADD CONSTRAINT "pricing_books_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_books" ADD CONSTRAINT "pricing_books_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_products" ADD CONSTRAINT "pricing_products_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "pricing_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_add_ons" ADD CONSTRAINT "pricing_add_ons_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "pricing_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_discount_rules" ADD CONSTRAINT "pricing_discount_rules_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "pricing_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_duration_rules" ADD CONSTRAINT "pricing_duration_rules_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "pricing_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_settings" ADD CONSTRAINT "pricing_settings_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "pricing_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_change_logs" ADD CONSTRAINT "pricing_change_logs_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "pricing_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_change_logs" ADD CONSTRAINT "pricing_change_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
