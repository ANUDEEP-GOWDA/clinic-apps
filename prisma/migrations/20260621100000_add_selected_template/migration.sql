-- Add selectedTemplate column to Settings.
-- This column was present in schema.prisma but missing from the original
-- migration, causing Settings and Website pages to crash (Prisma SELECT
-- includes the column, but it doesn't exist in the DB).
ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "selectedTemplate" TEXT NOT NULL DEFAULT 'classic';
