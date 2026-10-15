CREATE TYPE "ReportApprovalStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

ALTER TABLE "Counselor"
ADD COLUMN "sessionFee" DOUBLE PRECISION NOT NULL DEFAULT 500;

ALTER TABLE "Report"
ADD COLUMN "approvalStatus" "ReportApprovalStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
ADD COLUMN "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedById" TEXT,
ADD COLUMN "reviewNote" TEXT,
ADD COLUMN "emailSentAt" TIMESTAMP(3);

UPDATE "Report"
SET "approvalStatus" = 'APPROVED';

CREATE INDEX "Report_approvalStatus_createdAt_idx"
ON "Report"("approvalStatus", "createdAt");

ALTER TABLE "Report"
ADD CONSTRAINT "Report_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
