CREATE TYPE "CounselorCertificationStatus" AS ENUM ('NOT_PROVIDED', 'PENDING_VERIFICATION', 'VERIFIED');
CREATE TYPE "CounselorCertificationEnrollmentStatus" AS ENUM ('ENROLLED', 'IN_PROGRESS', 'COMPLETED');

ALTER TABLE "Counselor"
ADD COLUMN "userId" TEXT,
ADD COLUMN "mobileNumber" TEXT,
ADD COLUMN "professionalQualifications" TEXT,
ADD COLUMN "certificationDetails" TEXT,
ADD COLUMN "certificationStatus" "CounselorCertificationStatus" NOT NULL DEFAULT 'NOT_PROVIDED',
ADD COLUMN "certificationVerifiedAt" TIMESTAMP(3),
ADD COLUMN "certificationVerifiedById" TEXT;

ALTER TABLE "Booking"
ADD COLUMN "meetingLink" TEXT;

CREATE UNIQUE INDEX "Counselor_userId_key" ON "Counselor"("userId");

ALTER TABLE "Counselor"
ADD CONSTRAINT "Counselor_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Counselor"
ADD CONSTRAINT "Counselor_certificationVerifiedById_fkey"
FOREIGN KEY ("certificationVerifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CounselorExperience" (
    "id" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CounselorExperience_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CounselorExperience_counselorId_key"
ON "CounselorExperience"("counselorId");

ALTER TABLE "CounselorExperience"
ADD CONSTRAINT "CounselorExperience_counselorId_fkey"
FOREIGN KEY ("counselorId") REFERENCES "Counselor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CounselorCertificationEnrollment" (
    "id" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "status" "CounselorCertificationEnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CounselorCertificationEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CounselorCertificationEnrollment_counselorId_key"
ON "CounselorCertificationEnrollment"("counselorId");

ALTER TABLE "CounselorCertificationEnrollment"
ADD CONSTRAINT "CounselorCertificationEnrollment_counselorId_fkey"
FOREIGN KEY ("counselorId") REFERENCES "Counselor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "Counselor" AS counselor
SET "userId" = account."id"
FROM "User" AS account
WHERE account."role" = 'COUNSELOR'
  AND lower(account."email") = lower(counselor."email")
  AND counselor."userId" IS NULL
  AND (
    SELECT COUNT(*)
    FROM "Counselor" AS matching
    WHERE lower(matching."email") = lower(counselor."email")
  ) = 1;

UPDATE "Counselor"
SET "certificationStatus" = 'PENDING_VERIFICATION'
WHERE "certificationDetails" IS NOT NULL AND length(trim("certificationDetails")) > 0;
