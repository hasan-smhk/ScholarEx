import { PrismaClient } from '@prisma/client';

const BUSINESS_TIME_ZONE = 'Asia/Kolkata';

const DAILY_SLOTS = [
  { startTime: '17:00', endTime: '18:00' },
  { startTime: '18:00', endTime: '19:00' },
  { startTime: '19:00', endTime: '20:00' },
];

function getBusinessDate(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
}

function getUpcomingBusinessDates(count: number): Date[] {
  const dates: Date[] = [];
  const today = getBusinessDate();
  const now = new Date();

  for (let offset = 0; dates.length < count && offset < count * 2 + 7; offset += 1) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() + offset);
    const weekday = date.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;

    if (offset === 0) {
      const localHour = Number(
        new Intl.DateTimeFormat('en-GB', {
          timeZone: BUSINESS_TIME_ZONE,
          hour: '2-digit',
          hourCycle: 'h23',
        }).format(now)
      );
      const localMinute = Number(
        new Intl.DateTimeFormat('en-GB', {
          timeZone: BUSINESS_TIME_ZONE,
          minute: '2-digit',
        }).format(now)
      );
      if (localHour * 60 + localMinute >= 20 * 60) continue;
    }

    dates.push(date);
  }

  return dates;
}

export function isCounselingSlot(date: Date, startTime: string, endTime: string): boolean {
  const weekday = date.getUTCDay();
  return (
    weekday >= 1 &&
    weekday <= 5 &&
    DAILY_SLOTS.some((slot) => slot.startTime === startTime && slot.endTime === endTime)
  );
}

export function counselingSlotIsInFuture(date: Date, startTime: string): boolean {
  const [hour, minute] = startTime.split(':').map(Number);
  const startsAtUtc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour - 5, minute - 30)
  );
  return startsAtUtc.getTime() > Date.now();
}

export async function ensureCounselingSchedule(prisma: PrismaClient): Promise<void> {
  const counselors = await prisma.counselor.findMany({
    where: { approvalStatus: 'APPROVED' },
    select: { id: true },
  });
  const dates = getUpcomingBusinessDates(10);

  for (const counselor of counselors) {
    for (const date of dates) {
      for (const slot of DAILY_SLOTS) {
        if (!counselingSlotIsInFuture(date, slot.startTime)) continue;

        await prisma.slot.upsert({
          where: {
            counselorId_date_startTime_endTime: {
              counselorId: counselor.id,
              date,
              startTime: slot.startTime,
              endTime: slot.endTime,
            },
          },
          update: {},
          create: { counselorId: counselor.id, date, ...slot },
        });
      }
    }
  }
}

export async function releaseExpiredCounselingReservations(prisma: PrismaClient): Promise<void> {
  const expiry = new Date(Date.now() - 15 * 60 * 1000);
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
