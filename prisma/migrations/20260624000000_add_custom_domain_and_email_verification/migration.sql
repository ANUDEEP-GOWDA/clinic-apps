-- customDomain on Clinic (from 0002_domain_and_email)
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "customDomain" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Clinic_customDomain_key" ON "Clinic"("customDomain");
CREATE INDEX IF NOT EXISTS "Clinic_customDomain_idx" ON "Clinic"("customDomain");

-- Global email uniqueness on User (from 0002_domain_and_email)
-- Drop per-clinic composite key if it still exists, then create global unique index.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_clinicId_email_key'
  ) THEN
    ALTER TABLE "User" DROP CONSTRAINT "User_clinicId_email_key";
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- emailVerified column on User (from 0003_email_verification)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- EmailVerificationToken table (from 0003_email_verification)
CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
  "id"        SERIAL PRIMARY KEY,
  "userId"    INTEGER NOT NULL,
  "tokenHash" TEXT    NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
