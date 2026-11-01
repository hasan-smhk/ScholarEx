import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware, { adminMiddleware } from '../middlewares/auth.middleware';
import {
  counselorApplicationDecisionEmail,
  counselorApplicationReceivedEmail,
  sendEmail,
} from '../services/email.service';
import { counselingSlotIsInFuture } from '../services/counselingSchedule';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/overview', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const [students, enrollments, bookings, counselors] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          hasUsedFreeSession: true,
          _count: { select: { enrollments: true, bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.enrollment.findMany({
        include: {
          student: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true, board: true, level: true } },
        },
        orderBy: { enrolledAt: 'desc' },
      }),
      prisma.booking.findMany({
        select: {
          id: true,
          isFreeSession: true,
          paymentStatus: true,
          cancellationStatus: true,
          cancellationRequestedAt: true,
          cancellationReviewedAt: true,
          cancellationReviewNote: true,
          cancelledAt: true,
          amount: true,
          razorpayOrderId: true,
          razorpayPaymentId: true,
          refundReference: true,
          refundProcessedAt: true,
          createdAt: true,
          student: { select: { id: true, name: true, email: true } },
          slot: {
            select: {
              date: true,
              startTime: true,
              endTime: true,
              counselor: { select: { name: true, specialization: true } },
            },
          },
          report: { select: { id: true, createdAt: true, approvalStatus: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.counselor.findMany({
        where: { approvalStatus: 'APPROVED' },
        select: { id: true, name: true, specialization: true, sessionFee: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    res.json({ students, enrollments, bookings, counselors });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Failed to load student activity' });
  }
});

router.patch('/bookings/:id/cancellation', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, reviewNote } = req.body;
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return res.status(400).json({ error: 'Cancellation decision must be APPROVED or REJECTED' });
    }
    if (reviewNote !== undefined && (typeof reviewNote !== 'string' || reviewNote.length > 2000)) {
      return res.status(400).json({ error: 'Review note must be 2,000 characters or fewer' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { slot: true },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.cancellationStatus !== 'REQUESTED' || booking.cancelledAt) {
      return res.status(409).json({ error: 'This booking has no pending cancellation request' });
    }
    if (status === 'APPROVED' && !counselingSlotIsInFuture(booking.slot.date, booking.slot.startTime)) {
      return res.status(409).json({ error: 'A cancellation cannot be approved after the session has started' });
    }

    const updatedBooking = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.booking.updateMany({
        where: {
          id: booking.id,
          cancellationStatus: 'REQUESTED',
          cancelledAt: null,
        },
        data: {
          cancellationStatus: status,
          cancellationReviewedAt: new Date(),
          cancellationReviewNote: typeof reviewNote === 'string' ? reviewNote.trim() || null : null,
          cancelledAt: status === 'APPROVED' ? new Date() : null,
        },
      });
      if (updated.count !== 1) throw new Error('CANCELLATION_ALREADY_REVIEWED');

      if (status === 'APPROVED') {
        const released = await transaction.slot.updateMany({
          where: { id: booking.slotId, isBooked: true },
          data: { isBooked: false },
        });
        if (released.count !== 1) throw new Error('BOOKING_SLOT_NOT_RESERVED');
      }

      return transaction.booking.findUnique({
        where: { id: booking.id },
        select: {
          id: true,
          cancellationStatus: true,
          cancellationReviewedAt: true,
          cancellationReviewNote: true,
          cancelledAt: true,
        },
      });
    });

    return res.json(updatedBooking);
  } catch (error) {
    if (error instanceof Error && error.message === 'CANCELLATION_ALREADY_REVIEWED') {
      return res.status(409).json({ error: 'This cancellation request has already been reviewed' });
    }
    if (error instanceof Error && error.message === 'BOOKING_SLOT_NOT_RESERVED') {
      return res.status(409).json({ error: 'The booking slot is no longer reserved' });
    }
    console.error('Booking cancellation review failed:', error);
    return res.status(500).json({ error: 'Failed to review cancellation request' });
  }
});

router.patch('/bookings/:id/refund', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const refundReference = typeof req.body.refundReference === 'string'
      ? req.body.refundReference.trim()
      : '';
    if (!refundReference || refundReference.length > 120) {
      return res.status(400).json({ error: 'Enter a refund reference of up to 120 characters' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        isFreeSession: true,
        paymentStatus: true,
        cancellationStatus: true,
        cancelledAt: true,
      },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (
      booking.isFreeSession ||
      booking.paymentStatus !== 'PAID' ||
      booking.cancellationStatus !== 'APPROVED' ||
      !booking.cancelledAt
    ) {
      return res.status(409).json({ error: 'Only paid, cancelled bookings can be marked as refunded' });
    }

    const updated = await prisma.booking.updateMany({
      where: {
        id: booking.id,
        paymentStatus: 'PAID',
        cancellationStatus: 'APPROVED',
        cancelledAt: { not: null },
      },
      data: {
        paymentStatus: 'REFUNDED',
        refundReference,
        refundProcessedAt: new Date(),
      },
    });
    if (updated.count !== 1) {
      return res.status(409).json({ error: 'Booking status changed. Refresh and try again.' });
    }

    return res.json({ id: booking.id, paymentStatus: 'REFUNDED', refundReference });
  } catch (error) {
    console.error('Booking refund recording failed:', error);
    return res.status(500).json({ error: 'Failed to record the refund' });
  }
});

router.patch('/counselors/:id/session-fee', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionFee } = req.body;
    if (typeof sessionFee !== 'number' || !Number.isFinite(sessionFee) || sessionFee < 1) {
      return res.status(400).json({ error: 'Session fee must be a positive number' });
    }
    const counselor = await prisma.counselor.update({
      where: { id: req.params.id },
      data: { sessionFee },
      select: { id: true, name: true, specialization: true, sessionFee: true },
    });
    res.json(counselor);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Counselor not found' });
    }
    console.error('Counselor fee update error:', error);
    res.status(500).json({ error: 'Failed to update counselor fee' });
  }
});

router.get('/counselor-certifications', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const counselors = await prisma.counselor.findMany({
      where: { userId: { not: null } },
      select: {
        id: true,
        name: true,
        email: true,
        specialization: true,
        mobileNumber: true,
        professionalQualifications: true,
        certificationDetails: true,
        certificationStatus: true,
        certificationVerifiedAt: true,
        approvalStatus: true,
        approvalReviewNote: true,
        approvalReviewedAt: true,
        applicationEmailSentAt: true,
        approvalEmailSentAt: true,
        createdAt: true,
        experience: { select: { yearsExperience: true, details: true } },
        certificationEnrollment: { select: { status: true, enrolledAt: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(counselors);
  } catch (error) {
    console.error('Counselor certification review queue failed:', error);
    res.status(500).json({ error: 'Failed to load counselor certification records' });
  }
});

router.patch('/counselors/:id/approval', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, reviewNote } = req.body;
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return res.status(400).json({ error: 'Counselor status must be APPROVED or REJECTED' });
    }
    if (reviewNote !== undefined && (typeof reviewNote !== 'string' || reviewNote.length > 2000)) {
      return res.status(400).json({ error: 'Review note must be 2,000 characters or fewer' });
    }

    const counselor = await prisma.counselor.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        approvalStatus: true,
        approvalReviewNote: true,
        approvalEmailSentAt: true,
      },
    });
    if (!counselor || !counselor.userId) {
      return res.status(404).json({ error: 'Counselor application not found' });
    }

    const decisionChanged = counselor.approvalStatus !== status;
    const updated = decisionChanged
      ? await prisma.counselor.update({
          where: { id: counselor.id },
          data: {
            approvalStatus: status,
            approvalReviewNote: typeof reviewNote === 'string' ? reviewNote.trim() || null : null,
            approvalReviewedAt: new Date(),
            approvalReviewedById: req.user!.userId,
            approvalEmailSentAt: null,
          },
          select: {
            id: true,
            approvalStatus: true,
            approvalReviewNote: true,
            approvalReviewedAt: true,
            approvalEmailSentAt: true,
          },
        })
      : counselor;

    if (updated.approvalEmailSentAt) return res.json(updated);

    try {
      await sendEmail({
        to: counselor.email,
        ...counselorApplicationDecisionEmail(
          counselor.name,
          status === 'APPROVED',
          typeof reviewNote === 'string' ? reviewNote.trim() : counselor.approvalReviewNote
        ),
      });
      const notified = await prisma.counselor.update({
        where: { id: counselor.id },
        data: { approvalEmailSentAt: new Date() },
        select: {
          id: true,
          approvalStatus: true,
          approvalReviewNote: true,
          approvalReviewedAt: true,
          approvalEmailSentAt: true,
        },
      });
      return res.json(notified);
    } catch (emailError) {
      console.error('Counselor approval notification email failed:', emailError);
      return res.status(502).json({
        error: 'Counselor decision was saved, but the notification email failed. Retry the notification after fixing email delivery.',
      });
    }
  } catch (error) {
    console.error('Counselor approval review failed:', error);
    res.status(500).json({ error: 'Failed to update counselor application' });
  }
});

router.post('/counselors/:id/application-email', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const counselor = await prisma.counselor.findUnique({
      where: { id: req.params.id },
      select: { id: true, userId: true, name: true, email: true, applicationEmailSentAt: true },
    });
    if (!counselor || !counselor.userId) {
      return res.status(404).json({ error: 'Counselor application not found' });
    }
    if (counselor.applicationEmailSentAt) {
      return res.status(409).json({ error: 'The application confirmation email has already been sent' });
    }
    await sendEmail({
      to: counselor.email,
      ...counselorApplicationReceivedEmail(counselor.name),
    });
    const updated = await prisma.counselor.update({
      where: { id: counselor.id },
      data: { applicationEmailSentAt: new Date() },
      select: { id: true, applicationEmailSentAt: true },
    });
    res.json(updated);
  } catch (error) {
    console.error('Counselor application confirmation resend failed:', error);
    res.status(502).json({ error: 'Could not send the counselor application confirmation email' });
  }
});

router.patch('/counselors/:id/certification-verification', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    if (typeof req.body.verified !== 'boolean') {
      return res.status(400).json({ error: 'Choose whether the certification has been verified' });
    }
    const counselor = await prisma.counselor.findUnique({
      where: { id: req.params.id },
      select: { id: true, certificationDetails: true },
    });
    if (!counselor) return res.status(404).json({ error: 'Counselor not found' });
    if (req.body.verified && !counselor.certificationDetails?.trim()) {
      return res.status(409).json({ error: 'Certification details are required before verification' });
    }
    const updated = await prisma.counselor.update({
      where: { id: counselor.id },
      data: {
        certificationStatus: req.body.verified ? 'VERIFIED' : 'PENDING_VERIFICATION',
        certificationVerifiedAt: req.body.verified ? new Date() : null,
        certificationVerifiedById: req.body.verified ? req.user!.userId : null,
      },
      select: {
        id: true,
        certificationStatus: true,
        certificationVerifiedAt: true,
      },
    });
    res.json(updated);
  } catch (error) {
    console.error('Counselor certification verification failed:', error);
    res.status(500).json({ error: 'Failed to update counselor certification status' });
  }
});

router.patch('/enrollments/:id/progress', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { progress } = req.body;
    if (typeof progress !== 'number' || !Number.isFinite(progress) || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be a number between 0 and 100' });
    }

    const enrollment = await prisma.enrollment.update({
      where: { id: req.params.id },
      data: {
        progress,
        completed: progress === 100,
        completedAt: progress === 100 ? new Date() : null,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, board: true, level: true } },
      },
    });

    res.json(enrollment);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    console.error('Admin progress update error:', error);
    res.status(500).json({ error: 'Failed to update student progress' });
  }
});

export default router;