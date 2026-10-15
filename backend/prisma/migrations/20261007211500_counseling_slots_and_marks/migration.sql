ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "marksPercentage" DOUBLE PRECISION;

ALTER TABLE "Booking"
ADD COLUMN IF NOT EXISTS "marksPercentage" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "AnnualfamilyIncome" INTEGER,
ADD COLUMN IF NOT EXISTS "fatherOcuupation" TEXT,
ADD COLUMN IF NOT EXISTS "motherOcuupation" TEXT;

WITH ranked_slots AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY "counselorId", "date", "startTime", "endTime"
      ORDER BY "isBooked" DESC, "createdAt" ASC, "id" ASC
    ) AS "canonicalId",
    ROW_NUMBER() OVER (
      PARTITION BY "counselorId", "date", "startTime", "endTime"
      ORDER BY "isBooked" DESC, "createdAt" ASC, "id" ASC
    ) AS "rowNumber"
  FROM "Slot"
)
UPDATE "Booking" AS booking
SET "slotId" = ranked_slots."canonicalId"
FROM ranked_slots
WHERE booking."slotId" = ranked_slots."id"
  AND ranked_slots."rowNumber" > 1;

WITH ranked_slots AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "counselorId", "date", "startTime", "endTime"
      ORDER BY "isBooked" DESC, "createdAt" ASC, "id" ASC
    ) AS "rowNumber"
  FROM "Slot"
)
DELETE FROM "Slot" AS slot
USING ranked_slots
WHERE slot."id" = ranked_slots."id"
  AND ranked_slots."rowNumber" > 1;

CREATE UNIQUE INDEX "Slot_counselorId_date_startTime_endTime_key"
ON "Slot"("counselorId", "date", "startTime", "endTime");
