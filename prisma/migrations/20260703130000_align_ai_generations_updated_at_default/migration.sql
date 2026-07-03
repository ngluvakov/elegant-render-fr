-- Usklađivanje migracione istorije sa stvarnim stanjem (drift cleanup
-- 2026-07-03): add_ai_studio je kreirao "updatedAt" sa DEFAULT
-- CURRENT_TIMESTAMP, ali schema.prisma (@updatedAt bez @default) i živa
-- baza nemaju default — Prisma ga ionako nikad ne koristi jer updatedAt
-- upisuje eksplicitno. Na živoj bazi je ovo no-op (default već ne
-- postoji); postoji da bi replay istorije davao identičnu šemu.

-- AlterTable
ALTER TABLE "ai_generations" ALTER COLUMN "updatedAt" DROP DEFAULT;
