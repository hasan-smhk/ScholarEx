CREATE TYPE "CounselorApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "Counselor"
ADD COLUMN "approvalStatus" "CounselorApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "approvalReviewNote" TEXT,
ADD COLUMN "approvalReviewedAt" TIMESTAMP(3),
ADD COLUMN "approvalReviewedById" TEXT,
ADD COLUMN "applicationEmailSentAt" TIMESTAMP(3),
ADD COLUMN "approvalEmailSentAt" TIMESTAMP(3);

ALTER TABLE "Counselor"
ADD CONSTRAINT "Counselor_approvalReviewedById_fkey"
FOREIGN KEY ("approvalReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
