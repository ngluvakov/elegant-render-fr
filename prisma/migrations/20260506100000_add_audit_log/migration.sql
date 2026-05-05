-- Forensically-stable record of consequential admin and system actions.
-- ISO 27001:2022 control A.8.15 (Logging) + GDPR Art. 32. Insertion is
-- best-effort by recordAuditLog() — actions never fail because of an
-- audit write error.
CREATE TABLE "audit_logs" (
  "id"         TEXT NOT NULL,
  "actorId"    TEXT,
  "actorEmail" TEXT,
  "action"     TEXT NOT NULL,
  "entityType" TEXT,
  "entityId"   TEXT,
  "metadata"   JSONB,
  "ipAddress"  TEXT,
  "userAgent"  TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_actorId_createdAt_idx"
  ON "audit_logs" ("actorId", "createdAt");

CREATE INDEX "audit_logs_entityType_entityId_idx"
  ON "audit_logs" ("entityType", "entityId");

CREATE INDEX "audit_logs_action_createdAt_idx"
  ON "audit_logs" ("action", "createdAt");

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
