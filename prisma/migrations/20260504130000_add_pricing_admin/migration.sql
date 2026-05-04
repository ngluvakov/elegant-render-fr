-- Finance admin flag
ALTER TABLE "users"
  ADD COLUMN "canManageFinance" BOOLEAN NOT NULL DEFAULT false;

-- Versioned pricing catalog
CREATE TYPE "PricingBookStatus" AS ENUM ('draft', 'published', 'archived');

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

CREATE TABLE "pricing_products" (
  "id" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "unitLabel" TEXT NOT NULL,
  "basePriceEur" DOUBLE PRECISION NOT NULL,
  "includesJson" JSONB NOT NULL,
  "inquiryOnly" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pricing_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pricing_add_ons" (
  "id" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "addOnId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priceEur" DOUBLE PRECISION NOT NULL,
  "priceType" TEXT NOT NULL,
  "includedQty" INTEGER NOT NULL,
  "maxQty" INTEGER,
  "volumeRulesJson" JSONB NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pricing_add_ons_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "pricing_duration_rules" (
  "id" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sourceMode" TEXT,
  "minSeconds" INTEGER NOT NULL,
  "defaultSeconds" INTEGER NOT NULL,
  "maxSeconds" INTEGER,
  "perSecondEur" DOUBLE PRECISION NOT NULL,
  "discountTiersJson" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pricing_duration_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pricing_settings" (
  "id" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "valueJson" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pricing_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pricing_change_logs" (
  "id" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "detailsJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pricing_change_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pricing_books_status_publishedAt_idx"
  ON "pricing_books"("status", "publishedAt");
CREATE UNIQUE INDEX "pricing_products_bookId_productId_key"
  ON "pricing_products"("bookId", "productId");
CREATE INDEX "pricing_products_bookId_categoryId_idx"
  ON "pricing_products"("bookId", "categoryId");
CREATE UNIQUE INDEX "pricing_add_ons_bookId_productId_addOnId_key"
  ON "pricing_add_ons"("bookId", "productId", "addOnId");
CREATE INDEX "pricing_add_ons_bookId_productId_idx"
  ON "pricing_add_ons"("bookId", "productId");
CREATE UNIQUE INDEX "pricing_discount_rules_bookId_ruleId_key"
  ON "pricing_discount_rules"("bookId", "ruleId");
CREATE INDEX "pricing_discount_rules_bookId_productId_idx"
  ON "pricing_discount_rules"("bookId", "productId");
CREATE UNIQUE INDEX "pricing_duration_rules_bookId_productId_sourceMode_key"
  ON "pricing_duration_rules"("bookId", "productId", "sourceMode");
CREATE INDEX "pricing_duration_rules_bookId_productId_idx"
  ON "pricing_duration_rules"("bookId", "productId");
CREATE UNIQUE INDEX "pricing_settings_bookId_key_key"
  ON "pricing_settings"("bookId", "key");
CREATE INDEX "pricing_change_logs_bookId_createdAt_idx"
  ON "pricing_change_logs"("bookId", "createdAt");
CREATE INDEX "pricing_change_logs_actorId_createdAt_idx"
  ON "pricing_change_logs"("actorId", "createdAt");

ALTER TABLE "pricing_books"
  ADD CONSTRAINT "pricing_books_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pricing_books"
  ADD CONSTRAINT "pricing_books_publishedById_fkey"
  FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pricing_products"
  ADD CONSTRAINT "pricing_products_bookId_fkey"
  FOREIGN KEY ("bookId") REFERENCES "pricing_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pricing_add_ons"
  ADD CONSTRAINT "pricing_add_ons_bookId_fkey"
  FOREIGN KEY ("bookId") REFERENCES "pricing_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pricing_discount_rules"
  ADD CONSTRAINT "pricing_discount_rules_bookId_fkey"
  FOREIGN KEY ("bookId") REFERENCES "pricing_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pricing_duration_rules"
  ADD CONSTRAINT "pricing_duration_rules_bookId_fkey"
  FOREIGN KEY ("bookId") REFERENCES "pricing_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pricing_settings"
  ADD CONSTRAINT "pricing_settings_bookId_fkey"
  FOREIGN KEY ("bookId") REFERENCES "pricing_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pricing_change_logs"
  ADD CONSTRAINT "pricing_change_logs_bookId_fkey"
  FOREIGN KEY ("bookId") REFERENCES "pricing_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pricing_change_logs"
  ADD CONSTRAINT "pricing_change_logs_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
