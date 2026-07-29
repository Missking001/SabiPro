/*
  Warnings:

  - Added the required column `bankName` to the `Payout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "bankName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankCode" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "documentUrls" TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "loginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "gatewayRef" TEXT,
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentLog_transactionId_idx" ON "PaymentLog"("transactionId");

-- CreateIndex
CREATE INDEX "PaymentLog_gatewayRef_idx" ON "PaymentLog"("gatewayRef");

-- CreateIndex
CREATE INDEX "ContentFlag_targetId_idx" ON "ContentFlag"("targetId");

-- CreateIndex
CREATE INDEX "ContentFlag_status_idx" ON "ContentFlag"("status");

-- CreateIndex
CREATE INDEX "ContentFlag_reportedBy_targetId_idx" ON "ContentFlag"("reportedBy", "targetId");

-- CreateIndex
CREATE INDEX "Inquiry_consumerId_providerId_idx" ON "Inquiry"("consumerId", "providerId");

-- CreateIndex
CREATE INDEX "Inquiry_providerId_idx" ON "Inquiry"("providerId");

-- CreateIndex
CREATE INDEX "Inquiry_consumerId_idx" ON "Inquiry"("consumerId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Payout_providerId_idx" ON "Payout"("providerId");

-- CreateIndex
CREATE INDEX "Payout_transactionId_idx" ON "Payout"("transactionId");

-- CreateIndex
CREATE INDEX "Provider_tradeCategory_idx" ON "Provider"("tradeCategory");

-- CreateIndex
CREATE INDEX "Provider_location_idx" ON "Provider"("location");

-- CreateIndex
CREATE INDEX "Provider_onboardingState_idx" ON "Provider"("onboardingState");

-- CreateIndex
CREATE INDEX "Provider_isAvailable_idx" ON "Provider"("isAvailable");

-- CreateIndex
CREATE INDEX "Transaction_consumerId_idx" ON "Transaction"("consumerId");

-- CreateIndex
CREATE INDEX "Transaction_providerId_idx" ON "Transaction"("providerId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_payoutStatus_idx" ON "Transaction"("payoutStatus");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
