-- AlterTable
ALTER TABLE "LostItemRecord"
ADD COLUMN "trainOperator" TEXT,
ADD COLUMN "trainNumber" TEXT,
ADD COLUMN "destination" TEXT,
ADD COLUMN "departureTime" TEXT,
ADD COLUMN "platform" TEXT,
ADD COLUMN "carNumber" TEXT,
ADD COLUMN "seatNumber" TEXT;

-- CreateIndex
CREATE INDEX "LostItemRecord_trainOperator_idx" ON "LostItemRecord"("trainOperator");

-- CreateIndex
CREATE INDEX "LostItemRecord_trainNumber_idx" ON "LostItemRecord"("trainNumber");

-- CreateIndex
CREATE INDEX "LostItemRecord_destination_idx" ON "LostItemRecord"("destination");
