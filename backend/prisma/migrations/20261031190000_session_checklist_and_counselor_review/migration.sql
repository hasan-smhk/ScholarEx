ALTER TYPE "ReportApprovalStatus" ADD VALUE 'COUNSELOR_REVIEW';

ALTER TABLE "Booking"
ADD COLUMN "sessionChecklistAnswers" JSONB,
ADD COLUMN "sessionChecklistCompletedAt" TIMESTAMP(3);

ALTER TABLE "Report"
ADD COLUMN "counselorReviewedAt" TIMESTAMP(3),
ADD COLUMN "counselorReviewedById" TEXT;

ALTER TABLE "Report"
ADD CONSTRAINT "Report_counselorReviewedById_fkey"
FOREIGN KEY ("counselorReviewedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
