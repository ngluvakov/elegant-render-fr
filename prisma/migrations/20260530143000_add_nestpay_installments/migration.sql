-- Persist the customer-selected Nestpay installment count so the
-- confirmation page, transactional emails, and support audits can show
-- whether the HPP request was single-payment or sent with TAKSIT.

ALTER TABLE "orders"
  ADD COLUMN "nestpayInstallmentCount" INTEGER;
