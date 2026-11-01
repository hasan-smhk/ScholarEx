ALTER TABLE "Slot"
ADD COLUMN "isAvailable" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Slot"
SET "isAvailable" = false
WHERE EXTRACT(ISODOW FROM "date") BETWEEN 1 AND 5
  AND (
    ("startTime" = '17:00' AND "endTime" = '18:00')
    OR ("startTime" = '18:00' AND "endTime" = '19:00')
    OR ("startTime" = '19:00' AND "endTime" = '20:00')
  );

UPDATE "Counselor"
SET "approvalStatus" = 'REJECTED',
    "approvalReviewNote" = 'Retired pre-seeded counselor profile.'
WHERE lower("email") = 'counselor1@scholarex.com'
  AND "name" = 'Syed Baqar';
