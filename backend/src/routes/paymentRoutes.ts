import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import authMiddleware from '../middlewares/auth.middleware';
import { releaseExpiredCounselingReservations } from '../services/counselingSchedule';

const router = express.Router();
const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE ORDER
// ═══════════════════════════════════════════════════════════════════════════════

// POST: Create Razorpay order for booking payment
router.post('/create-order', authMiddleware, async (req: Request, res: Response) => {
  try {
    await releaseExpiredCounselingReservations(prisma);
    const { bookingId } = req.body;
    const studentId = (req as any).user.userId;

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID required' });
    }

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.studentId !== studentId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (booking.isFreeSession || booking.paymentStatus !== 'PENDING') {
      return res.status(400).json({ error: 'This booking does not require payment' });
    }
    if (booking.createdAt.getTime() < Date.now() - 15 * 60 * 1000) {
      return res.status(409).json({ error: 'This slot reservation expired. Please book another slot.' });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(booking.amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `booking-${bookingId}`,
      notes: {
        bookingId,
        studentId,
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFY PAYMENT
// ═══════════════════════════════════════════════════════════════════════════════

// POST: Verify payment and update booking status
router.post('/verify-payment', authMiddleware, async (req: Request, res: Response) => {
  try {
    await releaseExpiredCounselingReservations(prisma);
    const { orderId, paymentId, signature, bookingId } = req.body;
    const studentId = (req as any).user.userId;

    if (!orderId || !paymentId || !signature || !bookingId) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { slot: true },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.studentId !== studentId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (booking.isFreeSession) {
      return res.status(400).json({ error: 'This booking does not require payment' });
    }
    if (booking.createdAt.getTime() < Date.now() - 15 * 60 * 1000) {
      return res.status(409).json({ error: 'This slot reservation expired. Please book another slot.' });
    }

    // Verify signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const order = await razorpay.orders.fetch(orderId);
    if (
      order.receipt !== `booking-${bookingId}` ||
      order.notes?.bookingId !== bookingId ||
      order.notes?.studentId !== studentId ||
      order.amount !== Math.round(booking.amount * 100)
    ) {
      return res.status(400).json({ error: 'Payment order does not match this booking' });
    }

    if (booking.paymentStatus === 'PAID') {
      return res.json({
        message: 'Payment already verified',
        booking,
      });
    }

    let updatedBooking;
    try {
      updatedBooking = await prisma.$transaction(async (tx) => {
        const reservedSlot = await tx.slot.findFirst({
          where: { id: booking.slotId, isBooked: true },
          select: { id: true },
        });
        if (!reservedSlot) {
          throw new Error('SLOT_UNAVAILABLE');
        }

        const updatedCount = await tx.booking.updateMany({
          where: {
            id: bookingId,
            studentId,
            paymentStatus: 'PENDING',
            createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
          },
          data: { paymentStatus: 'PAID' },
        });

        if (updatedCount.count !== 1) {
          throw new Error('BOOKING_ALREADY_PROCESSED');
        }

        return tx.booking.findUnique({
          where: { id: bookingId },
          include: {
            slot: { include: { counselor: true } },
            student: true,
          },
        });
      });
    } catch (error) {
      const currentBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          slot: { include: { counselor: true } },
          student: true,
        },
      });

      if (currentBooking?.paymentStatus === 'PAID') {
        return res.json({ message: 'Payment already verified', booking: currentBooking });
      }

      if (error instanceof Error && error.message === 'SLOT_UNAVAILABLE') {
        return res.status(409).json({ error: 'Slot is no longer available' });
      }

      throw error;
    }

    // TODO: Send email confirmation (next section)
    console.log('Payment verified for booking:', bookingId);

    res.json({
      message: 'Payment verified successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET PAYMENT DETAILS
// ═══════════════════════════════════════════════════════════════════════════════

// GET: Fetch payment details for a booking
router.get('/booking/:bookingId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const studentId = (req as any).user.userId;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        slot: { include: { counselor: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.studentId !== studentId && (req as any).user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      bookingId: booking.id,
      amount: booking.amount,
      paymentStatus: booking.paymentStatus,
      isFreeSession: booking.isFreeSession,
      counselor: booking.slot.counselor.name,
      date: booking.slot.date,
      time: `${booking.slot.startTime} - ${booking.slot.endTime}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});

export default router;
