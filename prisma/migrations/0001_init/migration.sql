-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'DOCTOR', 'STAFF');

-- CreateTable
CREATE TABLE "Clinic" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "clinicName" TEXT NOT NULL DEFAULT '',
    "tagline" TEXT NOT NULL DEFAULT '',
    "about" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "googlePlaceId" TEXT NOT NULL DEFAULT '',
    "googleMapsUrl" TEXT NOT NULL DEFAULT '',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "workingHours" JSONB NOT NULL DEFAULT '{}',
    "themeConfig" JSONB NOT NULL DEFAULT '{}',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "faviconUrl" TEXT NOT NULL DEFAULT '',
    "heroImageUrl" TEXT NOT NULL DEFAULT '',
    "heroHeadline" TEXT NOT NULL DEFAULT '',
    "heroSubheadline" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL DEFAULT '',
    "qualifications" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "specialties" TEXT NOT NULL DEFAULT '',
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "consultationDurationMin" INTEGER NOT NULL DEFAULT 15,
    "acceptingAppointments" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorSchedule" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DoctorSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorDayOverride" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fullDayOff" BOOLEAN NOT NULL DEFAULT false,
    "blockStart" TEXT,
    "blockEnd" TEXT,
    "reason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorDayOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '',
    "durationMin" INTEGER NOT NULL DEFAULT 15,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "gender" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "publicId" TEXT NOT NULL,
    "patientId" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "serviceId" INTEGER,
    "type" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "appointmentType" TEXT NOT NULL DEFAULT 'consultation',
    "reasonForVisit" TEXT NOT NULL DEFAULT '',
    "slotDatetime" TIMESTAMP(3),
    "durationMin" INTEGER NOT NULL DEFAULT 15,
    "originalSlotDatetime" TIMESTAMP(3),
    "parentCardId" INTEGER,
    "actualStartAt" TIMESTAMP(3),
    "actualEndAt" TIMESTAMP(3),
    "patientConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardEvent" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "cardId" INTEGER NOT NULL,
    "fromType" TEXT,
    "toType" TEXT,
    "fromState" TEXT,
    "toState" TEXT,
    "actorUserId" INTEGER,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationDetails" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "cardId" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "sentMessage" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationAttachment" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "cardId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultationAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallRequest" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "preferredTime" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT 'pending',
    "handledBy" INTEGER,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL,
    "googleReviewId" TEXT,
    "authorPhotoUrl" TEXT NOT NULL DEFAULT '',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedBy" INTEGER,
    "altText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxJob" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lastError" TEXT NOT NULL DEFAULT '',
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "sentAt" TIMESTAMP(3),
    "cardId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboxJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappMessage" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "patientId" INTEGER,
    "cardId" INTEGER,
    "waMessageId" TEXT,
    "templateName" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '',
    "rawPayload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "responseJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CronRun" (
    "id" SERIAL NOT NULL,
    "job" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "ok" BOOLEAN,
    "details" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "CronRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_slug_key" ON "Clinic"("slug");

-- CreateIndex
CREATE INDEX "Clinic_active_idx" ON "Clinic"("active");

-- CreateIndex
CREATE INDEX "User_clinicId_idx" ON "User"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "User_clinicId_email_key" ON "User"("clinicId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_clinicId_key" ON "Settings"("clinicId");

-- CreateIndex
CREATE INDEX "Doctor_clinicId_active_acceptingAppointments_idx" ON "Doctor"("clinicId", "active", "acceptingAppointments");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_clinicId_slug_key" ON "Doctor"("clinicId", "slug");

-- CreateIndex
CREATE INDEX "DoctorSchedule_clinicId_doctorId_idx" ON "DoctorSchedule"("clinicId", "doctorId");

-- CreateIndex
CREATE INDEX "DoctorDayOverride_clinicId_doctorId_date_idx" ON "DoctorDayOverride"("clinicId", "doctorId", "date");

-- CreateIndex
CREATE INDEX "Service_clinicId_active_idx" ON "Service"("clinicId", "active");

-- CreateIndex
CREATE INDEX "Patient_clinicId_name_idx" ON "Patient"("clinicId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_clinicId_phone_key" ON "Patient"("clinicId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Card_publicId_key" ON "Card"("publicId");

-- CreateIndex
CREATE INDEX "Card_clinicId_doctorId_slotDatetime_idx" ON "Card"("clinicId", "doctorId", "slotDatetime");

-- CreateIndex
CREATE INDEX "Card_clinicId_patientId_idx" ON "Card"("clinicId", "patientId");

-- CreateIndex
CREATE INDEX "Card_clinicId_type_state_idx" ON "Card"("clinicId", "type", "state");

-- CreateIndex
CREATE INDEX "Card_clinicId_slotDatetime_idx" ON "Card"("clinicId", "slotDatetime");

-- CreateIndex
CREATE INDEX "CardEvent_clinicId_cardId_idx" ON "CardEvent"("clinicId", "cardId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationDetails_cardId_key" ON "ConsultationDetails"("cardId");

-- CreateIndex
CREATE INDEX "ConsultationAttachment_clinicId_cardId_idx" ON "ConsultationAttachment"("clinicId", "cardId");

-- CreateIndex
CREATE INDEX "CallRequest_clinicId_state_createdAt_idx" ON "CallRequest"("clinicId", "state", "createdAt");

-- CreateIndex
CREATE INDEX "Review_clinicId_featured_displayOrder_idx" ON "Review"("clinicId", "featured", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Review_clinicId_googleReviewId_key" ON "Review"("clinicId", "googleReviewId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteContent_clinicId_key_key" ON "SiteContent"("clinicId", "key");

-- CreateIndex
CREATE INDEX "Media_clinicId_createdAt_idx" ON "Media"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "OutboxJob_status_scheduledAt_idx" ON "OutboxJob"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "OutboxJob_clinicId_status_idx" ON "OutboxJob"("clinicId", "status");

-- CreateIndex
CREATE INDEX "OutboxJob_clinicId_cardId_idx" ON "OutboxJob"("clinicId", "cardId");

-- CreateIndex
CREATE INDEX "WhatsappMessage_clinicId_patientId_idx" ON "WhatsappMessage"("clinicId", "patientId");

-- CreateIndex
CREATE INDEX "WhatsappMessage_clinicId_cardId_idx" ON "WhatsappMessage"("clinicId", "cardId");

-- CreateIndex
CREATE INDEX "WhatsappMessage_clinicId_createdAt_idx" ON "WhatsappMessage"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_clinicId_entityType_entityId_idx" ON "AuditLog"("clinicId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_clinicId_createdAt_idx" ON "AuditLog"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_clinicId_userId_createdAt_idx" ON "AuditLog"("clinicId", "userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_key_key" ON "IdempotencyKey"("key");

-- CreateIndex
CREATE INDEX "IdempotencyKey_scope_createdAt_idx" ON "IdempotencyKey"("scope", "createdAt");

-- CreateIndex
CREATE INDEX "CronRun_job_startedAt_idx" ON "CronRun"("job", "startedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorDayOverride" ADD CONSTRAINT "DoctorDayOverride_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorDayOverride" ADD CONSTRAINT "DoctorDayOverride_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_parentCardId_fkey" FOREIGN KEY ("parentCardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardEvent" ADD CONSTRAINT "CardEvent_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardEvent" ADD CONSTRAINT "CardEvent_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationDetails" ADD CONSTRAINT "ConsultationDetails_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationDetails" ADD CONSTRAINT "ConsultationDetails_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationAttachment" ADD CONSTRAINT "ConsultationAttachment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationAttachment" ADD CONSTRAINT "ConsultationAttachment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRequest" ADD CONSTRAINT "CallRequest_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteContent" ADD CONSTRAINT "SiteContent_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxJob" ADD CONSTRAINT "OutboxJob_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxJob" ADD CONSTRAINT "OutboxJob_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

