-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "cardId" INTEGER,
    "patientId" INTEGER NOT NULL,
    "billNumber" TEXT NOT NULL DEFAULT '',
    "lineItems" JSONB NOT NULL DEFAULT '[]',
    "subtotal" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "razorpayLinkId" TEXT,
    "razorpayLinkUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_billNumber_key" ON "Payment"("billNumber");

-- CreateIndex
CREATE INDEX "Payment_clinicId_status_createdAt_idx" ON "Payment"("clinicId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_clinicId_patientId_idx" ON "Payment"("clinicId", "patientId");

-- CreateIndex
CREATE INDEX "Payment_clinicId_cardId_idx" ON "Payment"("clinicId", "cardId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
