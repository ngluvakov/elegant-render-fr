-- GDPR Art. 17 erasure request flag on User. Null for users who
-- haven't requested deletion. Admin processes (anonymizes PII while
-- preserving accounting-required Order rows) within 30 days.
ALTER TABLE "users"
  ADD COLUMN "deletionRequestedAt" TIMESTAMP(3);
