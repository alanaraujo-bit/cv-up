-- Turns `export_history` into the export queue: the renderer claims rows here
-- instead of receiving a message, so a restarted worker loses no work.

-- AlterTable
ALTER TABLE "export_history" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- DropIndex
DROP INDEX "export_history_status_idx";

-- CreateIndex
CREATE INDEX "export_history_status_requestedAt_idx" ON "export_history"("status", "requestedAt");
