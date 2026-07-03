-- Hot-path indeksi koji su nedostajali: Postgres ne indeksira FK kolone
-- automatski. Portal lista ide po orders.userId, NestPay return/reconcile
-- po paymentId+paymentProvider, reconcile sweep-ovi po paymentStatus i
-- status; order_items/order_files se uvek join-uju po orderId.
-- Migracija je pisana ručno (migrate dev je blokiran drift-om iz
-- neuvezane grane — vidi docs/platform-decisions.md) u tačnom formatu
-- koji bi prisma migrate dev generisao.

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
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX "quotes_userId_idx" ON "quotes"("userId");
