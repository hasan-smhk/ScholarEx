CREATE TYPE "BookingCancellationStatus" AS ENUM ('NONE', 'REQUESTED', 'APPROVED', 'REJECTED');

ALTER TABLE "Booking"
ADD COLUMN "cancellationStatus" "BookingCancellationStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN "cancellationRequestedAt" TIMESTAMP(3),
ADD COLUMN "cancellationReviewedAt" TIMESTAMP(3),
ADD COLUMN "cancellationReviewNote" TEXT,
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "razorpayOrderId" TEXT,
ADD COLUMN "razorpayPaymentId" TEXT,
ADD COLUMN "studentPaymentEmailSentAt" TIMESTAMP(3),
ADD COLUMN "counselorPaymentEmailSentAt" TIMESTAMP(3),
ADD COLUMN "refundReference" TEXT,
ADD COLUMN "refundProcessedAt" TIMESTAMP(3);
