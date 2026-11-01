import { PrismaClient } from '@prisma/client';

export const COUNSELING_RESERVATION_MINUTES = 60;

export const COUNSELING_SLOTS = [
  { startTime: '17:00', endTime: '18:00' },
  { startTime: '18:00', endTime: '19:00' },
  { startTime: '19:00', endTime: '20:00' },
];

export function isCounselingSlot(date: Date, startTime: string, endTime: string): boolean {
  const weekday = date.getUTCDay();
  return (
    weekday >= 1 &&
    weekday <= 5 &&
    COUNSELING_SLOTS.some((slot) => slot.startTime === startTime && slot.endTime === endTime)
  );
}

export function counselingSlotIsInFuture(date: Date, startTime: string): boolean {
  const [hour, minute] = startTime.split(':').map(Number);
  const startsAtUtc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour - 5, minute - 30)
  );
  return startsAtUtc.getTime() > Date.now();
}

export async function releaseExpiredCounselingReservations(prisma: PrismaClient): Promise<void> {
  const expiry = new Date(Date.now() - COUNSELING_RESERVATION_MINUTES * 60 * 1000);
  const expiredBookings = await prisma.booking.findMany({
    where: { paymentStatus: 'PENDING', createdAt: { lt: expiry } },
    select: { id: true, slotId: true },
  });
  if (!expiredBookings.length) return;

  const bookingIds = expiredBookings.map(({ id }) => id);
  const slotIds = [...new Set(expiredBookings.map(({ slotId }) => slotId))];

  await prisma.$transaction(async (transaction) => {
    const expired = await transaction.booking.updateMany({
      where: { id: { in: bookingIds }, paymentStatus: 'PENDING' },
      data: { paymentStatus: 'FAILED' },
    });
    if (expired.count > 0) {
      await transaction.slot.updateMany({
        where: { id: { in: slotIds } },
        data: { isBooked: false },
      });
    }
  });
}
