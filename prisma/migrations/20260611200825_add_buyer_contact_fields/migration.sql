-- Rekonstruisano 2026-07-03: original je 2026-06-11 primenjen na živu
-- bazu iz lokalne sesije čiji rad nikad nije stigao u git (drift).
-- Sadržaj veran stvarnom stanju baze (text, nullable, bez defaulta);
-- checksum u _prisma_migrations je ažuriran na ovaj fajl. Kolone su
-- trenutno nekorišćene — usvojene u schema.prisma da istorija, šema i
-- baza budu identične. Vidi docs/platform-decisions.md (2026-07-03).

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "buyerAddress" TEXT,
ADD COLUMN "buyerCity" TEXT,
ADD COLUMN "buyerPhone" TEXT,
ADD COLUMN "buyerPostalCode" TEXT;
