-- Add emailVerified to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- Email verification tokens
CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
  "id"        SERIAL PRIMARY KEY,
  "userId"    INTEGER NOT NULL,
  "tokenHash" TEXT    NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
