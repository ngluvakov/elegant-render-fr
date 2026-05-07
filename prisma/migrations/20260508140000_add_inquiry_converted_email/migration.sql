-- Customer-facing notification email sent when an admin converts a
-- ProjectInquiry into a draft Order on the wire-transfer track.
-- Tells the customer their inquiry was reviewed and a predračun is
-- coming. Enqueued from convertInquiryToOrder, processed by the
-- existing outbox cron worker.

ALTER TYPE "OutboxEventType" ADD VALUE 'inquiry_converted_email';
