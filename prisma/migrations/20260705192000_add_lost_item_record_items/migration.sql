-- AlterTable
ALTER TABLE "LostItemRecord"
ADD COLUMN "items" JSONB NOT NULL DEFAULT '[]';
