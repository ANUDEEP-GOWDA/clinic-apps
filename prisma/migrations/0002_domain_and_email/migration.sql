-- Add customDomain to Clinic
ALTER TABLE "Clinic" ADD COLUMN "customDomain" TEXT;
CREATE UNIQUE INDEX "Clinic_customDomain_key" ON "Clinic"("customDomain");
CREATE INDEX "Clinic_customDomain_idx" ON "Clinic"("customDomain");

-- Make User.email globally unique (drop composite, add single)
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_clinicId_email_key";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
