-- CreateEnum
CREATE TYPE "OtStatus" AS ENUM ('BROUILLON', 'A_SAISIR_OBOTO', 'SAISI_OBOTO', 'RESTITUE', 'TRANSFERE_PREFECTURE', 'TRANSFERE_POLICE', 'ARCHIVE');

-- CreateTable
CREATE TABLE "LostItemRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deposant" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "email" TEXT,
    "lieu" TEXT NOT NULL,
    "trainRef" TEXT,
    "foundDate" TIMESTAMP(3) NOT NULL,
    "objectType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "colorState" TEXT NOT NULL,
    "brand" TEXT,
    "description" TEXT NOT NULL,
    "documents" JSONB NOT NULL,
    "documentName" TEXT,
    "hasMoney" BOOLEAN NOT NULL DEFAULT false,
    "moneyAmount" TEXT,
    "photos" JSONB NOT NULL,
    "sigDeposant" TEXT NOT NULL,
    "sigRde" TEXT NOT NULL,
    "obotoNumber" TEXT,
    "status" "OtStatus" NOT NULL DEFAULT 'A_SAISIR_OBOTO',
    "closingReason" TEXT,

    CONSTRAINT "LostItemRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LostItemAudit" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LostItemAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LostItemRecord_createdAt_idx" ON "LostItemRecord"("createdAt");

-- CreateIndex
CREATE INDEX "LostItemRecord_foundDate_idx" ON "LostItemRecord"("foundDate");

-- CreateIndex
CREATE INDEX "LostItemRecord_status_idx" ON "LostItemRecord"("status");

-- CreateIndex
CREATE INDEX "LostItemRecord_obotoNumber_idx" ON "LostItemRecord"("obotoNumber");

-- CreateIndex
CREATE INDEX "LostItemAudit_recordId_idx" ON "LostItemAudit"("recordId");

-- CreateIndex
CREATE INDEX "LostItemAudit_createdAt_idx" ON "LostItemAudit"("createdAt");

-- AddForeignKey
ALTER TABLE "LostItemAudit" ADD CONSTRAINT "LostItemAudit_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "LostItemRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
