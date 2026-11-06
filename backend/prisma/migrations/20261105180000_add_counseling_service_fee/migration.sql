ALTER TABLE "Booking"
ADD COLUMN "serviceFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "Counselor"
SET "sessionFee" = 500
WHERE "sessionFee" < 500;
