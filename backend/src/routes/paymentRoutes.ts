import express, { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import authMiddleware from '../middlewares/auth.middleware';
import {
  COUNSELING_RESERVATION_MINUTES,
  releaseExpiredCounselingReservations,
} from '../services/counselingSchedule';
import {
  counselorPaymentConfirmationEmail,
  sendEmail,
  studentPaymentConfirmationEmail,
} from '../services/email.service';
import { sendSessionLinkEmail } from '../services/sessionLinkEmail.service';

const router = express.Router();
const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

interface PaymentEmailResult {
  studentSent: boolean;
  counselorSent: boolean;
}

async function sendPaymentConfirmationEmails(bookingId: string): Promise<PaymentEmailResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: true,
      slot: { include: { counselor: true } },
    },
  });
  if (!booking) throw new Error('Booking not found while sending payment confirmation');

  let studentSent = Boolean(booking.studentPaymentEmailSentAt);
  let counselorSent = Boolean(booking.counselorPaymentEmailSentAt);
  const date = booking.slot.date.toLocaleDateString('en-IN', {
    dateStyle: 'long',
    timeZone: 'Asia/Kolkata',
  });

  if (!studentSent) {
    try {
      await sendEmail({
        to: booking.student.email,
        ...studentPaymentConfirmationEmail(
          booking.student.name,
          booking.slot.counselor.name,
          booking.slot.counselor.specialization,
          date,
          booking.slot.startTime,
          booking.slot.endTime,
          booking.amount
        ),
      });
      await prisma.booking.update({
        where: { id: booking.id },
        data: { studentPaymentEmailSentAt: new Date() },
      });
      studentSent = true;
    } catch (error) {
      console.error('Student payment confirmation email failed:', error);
    }
  }

  if (!counselorSent) {
    try {
      await sendEmail({
        to: booking.slot.counselor.email,
        ...counselorPaymentConfirmationEmail(
          booking.slot.counselor.name,
          booking.student.name,
          booking.slot.counselor.specialization,
          date,
          booking.slot.startTime,
          booking.slot.endTime,
          booking.amount
        ),
      });
      await prisma.booking.update({
        where: { id: booking.id },
        data: { counselorPaymentEmailSentAt: new Date() },
      });
      counselorSent = true;
    } catch (error) {
      console.error('Counselor payment confirmation email failed:', error);
    }
  }

  await sendSessionLinkEmail(bookingId);
  return { studentSent, counselorSent };
}

// ─── Razorpay HMAC Signature Verification ────────────────────────────────────
function verifyRazorpaySignature(
  rawBody: Buffer | string,
  signature: string,
  secret: string
): boolean {
  if (!/^[a-f\d]{64}$/i.test(signature) || !secret || !rawBody) return false;
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (signatureBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

// ─── Core Payment Confirmation Helper ────────────────────────────────────────
interface ProcessPaymentParams {
  bookingId: string;
  orderId: string;
  paymentId: string;
  source: 'WEBHOOK' | 'CLIENT_VERIFY' | 'RECOVERY_SYNC';
}

interface ProcessPaymentResult {
  booking: Prisma.BookingGetPayload<{
    include: { slot: { include: { counselor: true } }; student: true };
  }>;
  emailNotifications: PaymentEmailResult;
  alreadyProcessed: boolean;
}

async function processBookingPaymentConfirmation(
  params: ProcessPaymentParams
): Promise<ProcessPaymentResult> {
  const { bookingId, orderId, paymentId, source } = params;

  const currentBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      slot: { include: { counselor: true } },
      student: true,
    },
  });

  if (!currentBooking) {
    throw new Error('BOOKING_NOT_FOUND');
  }

  if (currentBooking.cancelledAt || currentBooking.paymentStatus === 'REFUNDED') {
    throw new Error('PAYMENT_NOT_RECOVERABLE');
  }

  if (currentBooking.paymentStatus === 'PAID') {
    if (
      (currentBooking.razorpayOrderId && currentBooking.razorpayOrderId !== orderId) ||
      (currentBooking.razorpayPaymentId && currentBooking.razorpayPaymentId !== paymentId)
    ) {
      throw new Error('PAYMENT_ALREADY_CONFIRMED');
    }
    const emailNotifications = await sendPaymentConfirmationEmails(bookingId);
    return {
      booking: currentBooking,
      emailNotifications,
      alreadyProcessed: true,
    };
  }

  if (
    currentBooking.paymentStatus !== 'PENDING' ||
    currentBooking.cancellationStatus !== 'NONE' ||
    currentBooking.cancelledAt ||
    !orderId ||
    !paymentId ||
    currentBooking.razorpayOrderId !== orderId
  ) {
    throw new Error('PAYMENT_NOT_RECOVERABLE');
  }

  const reservationExpiry = new Date(Date.now() - COUNSELING_RESERVATION_MINUTES * 60 * 1000);
  if (currentBooking.createdAt < reservationExpiry) {
    throw new Error('PAYMENT_RESERVATION_EXPIRED');
  }

  const updatedBooking = await prisma.$transaction(async (tx) => {
    const reservedSlot = await tx.slot.findFirst({
      where: { id: currentBooking.slotId, isBooked: true },
      select: { id: true },
    });
    if (!reservedSlot) throw new Error('SLOT_UNAVAILABLE');

    const updateResult = await tx.booking.updateMany({
      where: {
        id: bookingId,
        paymentStatus: 'PENDING',
        cancellationStatus: 'NONE',
        cancelledAt: null,
        razorpayOrderId: orderId,
        createdAt: { gte: reservationExpiry },
      },
      data: {
        paymentStatus: 'PAID',
        razorpayPaymentId: paymentId,
      },
    });
    if (updateResult.count !== 1) throw new Error('PAYMENT_STATE_CHANGED');

    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        slot: { include: { counselor: true } },
        student: true,
      },
    });
    if (!booking) throw new Error('BOOKING_NOT_FOUND');
    return booking;
  });

  console.log(
    `[Payment Confirmation] (${source}) Successfully confirmed booking ${bookingId} (Order: ${orderId}, Payment: ${paymentId})`
  );
  const emailNotifications = await sendPaymentConfirmationEmails(bookingId);

  return {
    booking: updatedBooking,
    emailNotifications,
    alreadyProcessed: false,
  };
}

async function recordManualPaymentReconciliation(
  bookingId: string,
  orderId: string,
  paymentId: string,
  source: ProcessPaymentParams['source']
): Promise<void> {
  await prisma.booking.updateMany({
    where: {
      id: bookingId,
      razorpayOrderId: orderId,
      paymentStatus: { in: ['PENDING', 'FAILED'] },
    },
    data: { paymentStatus: 'FAILED', razorpayPaymentId: paymentId },
  });
  console.error(
    `[Payment Manual Reconciliation Required] (${source}) Captured payment ${paymentId} for booking ${bookingId} (order ${orderId}) could not be confirmed automatically. Contact support to arrange a refund or resolve the booking.`
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE ORDER
// ═══════════════════════════════════════════════════════════════════════════════

// POST: Create Razorpay order for booking payment
router.post('/create-order', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can initiate booking payments' });
    }
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

    if (booking.isFreeSession || booking.paymentStatus !== 'PENDING' || booking.cancelledAt) {
      return res.status(400).json({ error: 'This booking does not require payment' });
    }
    if (booking.createdAt.getTime() < Date.now() - COUNSELING_RESERVATION_MINUTES * 60 * 1000) {
      return res.status(409).json({ error: 'This slot reservation expired. Please book another slot.' });
    }

    const order = booking.razorpayOrderId
      ? await razorpay.orders.fetch(booking.razorpayOrderId)
      : await razorpay.orders.create({
          amount: Math.round(booking.amount * 100),
          currency: 'INR',
          receipt: `booking-${bookingId}`,
          notes: { bookingId, studentId },
        });

    if (
      order.receipt !== `booking-${bookingId}` ||
      order.notes?.bookingId !== bookingId ||
      order.notes?.studentId !== studentId ||
      order.amount !== Math.round(booking.amount * 100) ||
      order.currency !== 'INR'
    ) {
      return res.status(409).json({ error: 'Payment order does not match this booking' });
    }

    if (!booking.razorpayOrderId) {
      const saved = await prisma.booking.updateMany({
        where: {
          id: bookingId,
          studentId,
          paymentStatus: 'PENDING',
          cancellationStatus: 'NONE',
          cancelledAt: null,
          razorpayOrderId: null,
          createdAt: { gte: new Date(Date.now() - COUNSELING_RESERVATION_MINUTES * 60 * 1000) },
        },
        data: { razorpayOrderId: order.id },
      });
      if (saved.count !== 1) {
        const current = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (current?.razorpayOrderId !== order.id) {
          return res.status(409).json({ error: 'Booking changed while creating the payment order. Retry payment.' });
        }
      }
    }

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFY PAYMENT (CLIENT-SIDE CALLBACK)
// ═══════════════════════════════════════════════════════════════════════════════

// POST: Verify payment and update booking status
router.post('/verify-payment', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can verify booking payments' });
    }
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

    // If webhook or previous verification already confirmed this booking
    if (booking.paymentStatus === 'PAID') {
      if (booking.razorpayOrderId && booking.razorpayOrderId !== orderId) {
        return res.status(409).json({ error: 'Payment order does not match this booking' });
      }
      if (booking.razorpayPaymentId && booking.razorpayPaymentId !== paymentId) {
        return res.status(409).json({ error: 'A different payment has already been verified for this booking' });
      }
      const emailNotifications = await sendPaymentConfirmationEmails(bookingId);
      return res.json({
        message: 'Payment already verified',
        booking,
        emailNotifications,
      });
    }

    if (booking.cancelledAt) {
      return res.status(409).json({ error: 'This booking has been cancelled' });
    }

    // Verify signature
    const body = orderId + '|' + paymentId;
    if (!verifyRazorpaySignature(
      Buffer.from(body),
      signature,
      process.env.RAZORPAY_KEY_SECRET || ''
    )) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const order = await razorpay.orders.fetch(orderId);
    if (
      order.receipt !== `booking-${bookingId}` ||
      order.notes?.bookingId !== bookingId ||
      order.notes?.studentId !== studentId ||
      order.amount !== Math.round(booking.amount * 100) ||
      order.currency !== 'INR' ||
      booking.razorpayOrderId !== orderId
    ) {
      return res.status(400).json({ error: 'Payment order does not match this booking' });
    }

    const payment = await razorpay.payments.fetch(paymentId);
    if (
      payment.order_id !== orderId ||
      payment.status !== 'captured' ||
      !payment.captured ||
      Number(payment.amount) !== Math.round(booking.amount * 100) ||
      payment.currency !== 'INR'
    ) {
      return res.status(409).json({ error: 'Razorpay has not confirmed a captured payment for this booking' });
    }

    let result: ProcessPaymentResult;
    try {
      result = await processBookingPaymentConfirmation({
        bookingId,
        orderId,
        paymentId,
        source: 'CLIENT_VERIFY',
      });
    } catch (error) {
      const reconciliationErrors = new Set([
        'PAYMENT_NOT_RECOVERABLE',
        'PAYMENT_RESERVATION_EXPIRED',
        'SLOT_UNAVAILABLE',
      ]);
      if (error instanceof Error && reconciliationErrors.has(error.message)) {
        await recordManualPaymentReconciliation(bookingId, orderId, paymentId, 'CLIENT_VERIFY');
        return res.status(409).json({
          error: 'Payment was captured but this reservation could not be confirmed. Contact support with the payment reference.',
          paymentReference: { bookingId, orderId, paymentId },
        });
      }
      throw error;
    }

    res.json({
      message: result.alreadyProcessed ? 'Payment already verified' : 'Payment verified successfully',
      booking: result.booking,
      emailNotifications: result.emailNotifications,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOK-BASED RECOVERY (HANDLES BROWSER CLOSE / NETWORK DROPS)
// ═══════════════════════════════════════════════════════════════════════════════

// POST: Razorpay Webhook Handler
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signatureHeader = req.headers['x-razorpay-signature'];
    if (typeof signatureHeader !== 'string') {
      console.warn('Razorpay webhook received without x-razorpay-signature header');
      return res.status(400).json({ error: 'Missing x-razorpay-signature header' });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Webhook secret not configured in environment variables');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    if (!req.rawBody || !verifyRazorpaySignature(req.rawBody, signatureHeader, webhookSecret)) {
      console.warn('Invalid Razorpay webhook signature');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body?.event;
    if (event !== 'payment.captured' && event !== 'order.paid') {
      return res.status(200).json({ status: 'ok', message: `Event ${event || 'unknown'} acknowledged` });
    }

    let payment = req.body?.payload?.payment?.entity;
    let orderId: string | undefined = payment?.order_id;

    if (event === 'order.paid') {
      const orderEntity = req.body?.payload?.order?.entity;
      orderId = typeof orderEntity?.id === 'string' ? orderEntity.id : undefined;
      if (!orderId) {
        console.error('Razorpay order.paid event did not contain an order ID');
        return res.status(400).json({ error: 'Missing Razorpay order ID' });
      }
      const paymentResponse = await razorpay.orders.fetchPayments(orderId);
      payment = paymentResponse.items.find((item) =>
        item.order_id === orderId && item.status === 'captured' && item.captured
      );
    }

    if (!payment || typeof payment.id !== 'string' || !orderId) {
      console.error(`Razorpay ${event} event did not include a captured payment`);
      return res.status(500).json({ error: 'Captured payment details are not available yet' });
    }
    if (
      payment.status !== 'captured' ||
      !payment.captured ||
      payment.order_id !== orderId ||
      payment.currency !== 'INR' ||
      !Number.isInteger(Number(payment.amount))
    ) {
      console.error(`Razorpay webhook payment ${payment.id} is not a valid captured INR payment`);
      return res.status(400).json({ error: 'Invalid captured payment details' });
    }

    const booking = await prisma.booking.findFirst({
      where: { razorpayOrderId: orderId },
    });
    if (!booking) {
      console.warn(`No booking is associated with Razorpay order ${orderId}`);
      return res.status(200).json({ status: 'ignored', message: 'No ScholarEx booking for this order' });
    }
    if (Number(payment.amount) !== Math.round(booking.amount * 100)) {
      console.error(`Razorpay webhook amount mismatch for booking ${booking.id}`);
      return res.status(400).json({ error: 'Payment amount does not match booking' });
    }

    const razorpayOrder = await razorpay.orders.fetch(orderId);
    if (
      razorpayOrder.id !== booking.razorpayOrderId ||
      razorpayOrder.receipt !== `booking-${booking.id}` ||
      razorpayOrder.notes?.bookingId !== booking.id ||
      razorpayOrder.notes?.studentId !== booking.studentId ||
      razorpayOrder.amount !== Math.round(booking.amount * 100) ||
      razorpayOrder.currency !== 'INR'
    ) {
      console.error(`Razorpay webhook order details mismatch for booking ${booking.id}`);
      return res.status(400).json({ error: 'Payment order does not match booking' });
    }

    try {
      const result = await processBookingPaymentConfirmation({
        bookingId: booking.id,
        orderId,
        paymentId: payment.id,
        source: 'WEBHOOK',
      });
      return res.status(200).json({
        status: 'ok',
        message: result.alreadyProcessed ? 'Payment already verified' : 'Payment confirmed via webhook',
        bookingId: booking.id,
      });
    } catch (error) {
      const reconciliationErrors = new Set([
        'PAYMENT_NOT_RECOVERABLE',
        'PAYMENT_RESERVATION_EXPIRED',
        'SLOT_UNAVAILABLE',
      ]);
      if (error instanceof Error && reconciliationErrors.has(error.message)) {
        await recordManualPaymentReconciliation(booking.id, orderId, payment.id, 'WEBHOOK');
        return res.status(200).json({
          status: 'manual_reconciliation_required',
          bookingId: booking.id,
          paymentId: payment.id,
        });
      }
      console.error(`Razorpay webhook could not reconcile booking ${booking.id}:`, error);
      return res.status(500).json({ error: 'Payment could not be reconciled; Razorpay should retry this webhook' });
    }
  } catch (error) {
    console.error('Error handling Razorpay webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ON-DEMAND PAYMENT RECOVERY / STATUS RETRY
// ═══════════════════════════════════════════════════════════════════════════════

// POST: Recover/retry verification if browser closed before verify-payment completed
router.post('/booking/:bookingId/recover', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const studentId = (req as any).user.userId;
    const role = (req as any).user.role;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { slot: { include: { counselor: true } } },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.studentId !== studentId && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // If already verified as paid
    if (booking.paymentStatus === 'PAID') {
      const emailNotifications = await sendPaymentConfirmationEmails(bookingId);
      return res.json({
        recovered: true,
        alreadyPaid: true,
        message: 'Payment is already confirmed',
        booking,
        emailNotifications,
      });
    }

    if (booking.isFreeSession) {
      return res.status(400).json({ error: 'Free sessions do not require payment recovery' });
    }
    if (booking.paymentStatus !== 'PENDING' || booking.cancelledAt || booking.cancellationStatus !== 'NONE') {
      return res.status(409).json({
        error: 'This booking is no longer eligible for automatic payment recovery. Contact support with your Razorpay payment details.',
        paymentReference: {
          bookingId: booking.id,
          orderId: booking.razorpayOrderId,
          paymentId: booking.razorpayPaymentId,
        },
      });
    }
    if (booking.createdAt.getTime() < Date.now() - COUNSELING_RESERVATION_MINUTES * 60 * 1000) {
      return res.status(409).json({
        error: 'This slot reservation expired. Contact support if Razorpay charged you.',
        paymentReference: {
          bookingId: booking.id,
          orderId: booking.razorpayOrderId,
          paymentId: booking.razorpayPaymentId,
        },
      });
    }

    if (!booking.razorpayOrderId) {
      return res.json({
        recovered: false,
        message: 'No payment order initiated for this booking yet',
        paymentStatus: booking.paymentStatus,
      });
    }

    // Query Razorpay API directly for order and payment statuses
    const order = await razorpay.orders.fetch(booking.razorpayOrderId);
    const payments = await razorpay.orders.fetchPayments(booking.razorpayOrderId);
    if (
      order.id !== booking.razorpayOrderId ||
      order.receipt !== `booking-${booking.id}` ||
      order.notes?.bookingId !== booking.id ||
      order.notes?.studentId !== booking.studentId ||
      order.amount !== Math.round(booking.amount * 100) ||
      order.currency !== 'INR'
    ) {
      console.error(`Razorpay recovery order does not match booking ${booking.id}`);
      return res.status(409).json({ error: 'Razorpay payment order does not match this booking' });
    }

    const capturedPayment = payments.items.find((payment) =>
      payment.order_id === order.id &&
      payment.status === 'captured' &&
      payment.captured &&
      payment.currency === 'INR' &&
      Number(payment.amount) === Math.round(booking.amount * 100)
    );

    if (capturedPayment) {
      const result = await processBookingPaymentConfirmation({
        bookingId: booking.id,
        orderId: order.id,
        paymentId: capturedPayment.id,
        source: 'RECOVERY_SYNC',
      });

      return res.json({
        recovered: true,
        message: 'Payment verified and recovered from Razorpay successfully',
        booking: result.booking,
        emailNotifications: result.emailNotifications,
      });
    }

    return res.json({
      recovered: false,
      message: 'No completed payment found on Razorpay for this booking',
      paymentStatus: booking.paymentStatus,
      orderStatus: order.status,
    });
  } catch (error) {
    console.error('Payment recovery error:', error);
    res.status(500).json({ error: 'Failed to recover payment status' });
  }
});

router.post('/booking/:bookingId/confirmation-email', authMiddleware, async (req: Request, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      select: { id: true, studentId: true, paymentStatus: true, cancelledAt: true },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.studentId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (booking.paymentStatus !== 'PAID' || booking.cancelledAt) {
      return res.status(409).json({ error: 'Payment confirmation emails are only available for active paid bookings' });
    }

    const emailNotifications = await sendPaymentConfirmationEmails(booking.id);
    if (!emailNotifications.studentSent || !emailNotifications.counselorSent) {
      return res.status(502).json({
        error: 'Payment is confirmed, but one or more confirmation emails could not be delivered. Retry after fixing email delivery.',
        emailNotifications,
      });
    }
    return res.json({ emailNotifications });
  } catch (error) {
    console.error('Payment confirmation email retry failed:', error);
    return res.status(500).json({ error: 'Could not resend payment confirmation emails' });
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
