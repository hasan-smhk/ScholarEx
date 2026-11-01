CREATE TABLE "StudentCareerAssessment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentClass" TEXT NOT NULL,
    "schoolCollege" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "educationBoard" TEXT NOT NULL,
    "academicPerformance" TEXT NOT NULL,
    "strongSubjects" TEXT NOT NULL,
    "dislikedSubjects" TEXT NOT NULL,
    "hobbies" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "improvementAreas" TEXT NOT NULL,
    "coursesOfInterest" TEXT NOT NULL,
    "learningStyle" TEXT NOT NULL,
    "likes" TEXT NOT NULL,
    "dislikes" TEXT NOT NULL,
    "careerGoal" TEXT NOT NULL,
    "parentsAspiration" TEXT NOT NULL,
    "report" JSONB,
    "reportEmailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentCareerAssessment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentCareerAssessment_studentId_key"
    ON "StudentCareerAssessment"("studentId");

ALTER TABLE "StudentCareerAssessment"
    ADD CONSTRAINT "StudentCareerAssessment_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
