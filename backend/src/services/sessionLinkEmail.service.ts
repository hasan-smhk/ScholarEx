import { PrismaClient } from '@prisma/client';
import { sendEmail, studentSessionLinkEmail } from './email.service';

const prisma = new PrismaClient();

export async function sendSessionLinkEmail(bookingId: string): Promise<boolean> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: true,
      slot: { include: { counselor: true } },
    },
  });

  if (
    !booking ||
    !booking.meetingLink ||
    booking.cancelledAt ||
    (!booking.isFreeSession && booking.paymentStatus !== 'PAID') ||
    booking.meetingLinkEmailSentAt
  ) {
    return Boolean(booking?.meetingLinkEmailSentAt);
  }

  const date = booking.slot.date.toLocaleDateString('en-IN', {
    dateStyle: 'long',
    timeZone: 'Asia/Kolkata',
  });

  try {
    await sendEmail({
      to: booking.emailId || booking.student.email,
      ...studentSessionLinkEmail(
        booking.student.name,
        booking.slot.counselor.name,
        date,
        booking.slot.startTime,
        booking.slot.endTime,
        booking.meetingLink
      ),
    });
    await prisma.booking.update({
      where: { id: booking.id },
      data: { meetingLinkEmailSentAt: new Date() },
    });
    return true;
  } catch (error) {
    console.error(`Session link email failed for booking ${booking.id}:`, error);
    return false;
  }
}
