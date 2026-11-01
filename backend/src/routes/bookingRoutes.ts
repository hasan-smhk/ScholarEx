import express, { Request, Response } from 'express';
import { PrismaClient, PaymentStatus } from '@prisma/client';
import authMiddleware from '../middlewares/auth.middleware';
import {
  counselingSlotIsInFuture,
  isCounselingSlot,
  releaseExpiredCounselingReservations,
} from '../services/counselingSchedule';
import { getCounselorProfileIdForUser } from '../services/counselorAccess.service';

const router = express.Router();
const prisma = new PrismaClient();

const normalizeOptionalAge = (age: unknown): number | null | undefined => {
  if (age === undefined) return undefined;
  if (age === null || age === '') return null;
  return Number(age);
};

const stopWords = new Set([
  'about', 'after', 'and', 'are', 'for', 'from', 'how', 'into', 'looking', 'need',
  'the', 'their', 'through', 'want', 'with', 'would', 'you', 'your',
]);

function getCounselingMatchScore(
  counselor: { id: string; specialization: string; description: string | null },
  intake: Record<string, unknown>,
  preferredCounselorId?: string
): number {
  const studentText = [
    intake.educationBackground,
    intake.currentStream,
    intake.careerAspiration,
    intake.areasOfInterest,
    intake.subjectPreferences,
    intake.hobbies,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();
  const counselorText = `${counselor.specialization} ${counselor.description || ''}`.toLowerCase();
  const tokens = (text: string) =>
    text.match(/[a-z0-9]+/g)?.filter((token) => token.length > 2 && !stopWords.has(token)) || [];
  const counselorTokens = new Set(tokens(counselorText));
  const overlap = [...new Set(tokens(studentText))].filter((token) => counselorTokens.has(token)).length;
  let score = overlap * 3;

  if (/career|college|university|stream|course|academic/.test(studentText) &&
      /career|academic|education|guidance/.test(counselorText)) {
    score += 2;
  }
  if (/skill|communication|interview|employability|certification/.test(studentText) &&
      /skill|communication|employability|certification/.test(counselorText)) {
    score += 3;
  }
  if (preferredCounselorId && counselor.id === preferredCounselorId) score += 1;

  return score;
}

// POST: Create a new booking
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can create counseling bookings' });
    }
    const studentId = req.user!.userId;
    const assessment = await prisma.studentCareerAssessment.findUnique({ where: { studentId } });
    if (!assessment?.report) {
      return res.status(409).json({ error: 'Complete your free career report before booking a counseling session' });
    }

    const preferredCounselorId =
      typeof req.body.preferredCounselorId === 'string' ? req.body.preferredCounselorId : undefined;
    const intake = {
      educationBackground: assessment.educationBoard,
      currentStream: assessment.studentClass,
      careerAspiration: assessment.careerGoal,
      areasOfInterest: [assessment.likes, assessment.hobbies, assessment.coursesOfInterest]
        .filter(Boolean)
        .join('; '),
      subjectPreferences: [
        assessment.strongSubjects && `Enjoyed/strong subjects: ${assessment.strongSubjects}`,
        assessment.dislikedSubjects && `Subjects for support: ${assessment.dislikedSubjects}`,
      ].filter(Boolean).join('; '),
      hobbies: assessment.hobbies,
    };

    await releaseExpiredCounselingReservations(prisma);
    const excludedSlotIds = new Set<string>();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const availableSlots = await prisma.slot.findMany({
        where: { isAvailable: true, isBooked: false, counselor: { approvalStatus: 'APPROVED' } },
        include: { counselor: true },
      });
      const rankedSlots = availableSlots
        .filter(
          (slot) =>
            !excludedSlotIds.has(slot.id) &&
            isCounselingSlot(slot.date, slot.startTime, slot.endTime) &&
            counselingSlotIsInFuture(slot.date, slot.startTime)
        )
        .sort((left, right) => {
          const fitDifference =
            getCounselingMatchScore(right.counselor, intake, preferredCounselorId) -
            getCounselingMatchScore(left.counselor, intake, preferredCounselorId);
          if (fitDifference !== 0) return fitDifference;
          const dateDifference = left.date.getTime() - right.date.getTime();
          return dateDifference || left.startTime.localeCompare(right.startTime);
        });

      if (!rankedSlots.length) {
        return res.status(409).json({ error: 'No counseling slots are currently available' });
      }

      const slot = rankedSlots[0];
      try {
        const booking = await prisma.$transaction(async (transaction) => {
          const student = await transaction.user.findUnique({
            where: { id: studentId },
            select: { name: true, email: true },
          });
          if (!student) throw new Error('STUDENT_NOT_FOUND');

          const reserved = await transaction.slot.updateMany({
            where: { id: slot.id, isAvailable: true, isBooked: false },
            data: { isBooked: true },
          });
          if (reserved.count !== 1) throw new Error('SLOT_UNAVAILABLE');

          return transaction.booking.create({
            data: {
              studentId,
              slotId: slot.id,
              isFreeSession: false,
              paymentStatus: PaymentStatus.PENDING,
              amount: slot.counselor.sessionFee,
              educationBackground: assessment.educationBoard,
              currentStream: assessment.studentClass,
              careerAspiration: assessment.careerGoal || null,
              areasOfInterest: intake.areasOfInterest || null,
              subjectPreferences: intake.subjectPreferences || null,
              hobbies: assessment.hobbies || null,
              studentName: student.name,
              schoolCollege: assessment.schoolCollege,
              phoneNo: assessment.phoneNumber,
              emailId: student.email,
            },
            include: {
              slot: { include: { counselor: true } },
            },
          });
        });

        return res.status(201).json(booking);
      } catch (error) {
        if (error instanceof Error && error.message === 'STUDENT_NOT_FOUND') {
          return res.status(404).json({ error: 'Student not found' });
        }
        if (error instanceof Error && error.message === 'SLOT_UNAVAILABLE') {
          excludedSlotIds.add(slot.id);
          continue;
        }
        throw error;
      }
    }

    return res.status(409).json({ error: 'The selected counseling slots were just booked. Please try again.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET: Get student's bookings
router.get('/my-bookings', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Student bookings are only available to students' });
    }
    const studentId = (req as any).user.userId;

    const bookings = await prisma.booking.findMany({
      where: { studentId },
      select: {
        id: true,
        isFreeSession: true,
        paymentStatus: true,
        cancellationStatus: true,
        cancellationReviewNote: true,
        cancelledAt: true,
        refundReference: true,
        amount: true,
        marksPercentage: true,
        meetingLink: true,
        studentName: true,
        studentAge: true,
        schoolCollege: true,
        phoneNo: true,
        emailId: true,
        address: true,
        educationBackground: true,
        currentStream: true,
        careerAspiration: true,
        areasOfInterest: true,
        subjectPreferences: true,
        hobbies: true,
        fatherName: true,
        fatherAge: true,
        fatherOcuupation: true,
        fatherEducation: true,
        motherName: true,
        motherAge: true,
        motherOcuupation: true,
        motherEducation: true,
        AnnualfamilyIncome: true,
        familyType: true,
        subjectAssessments: true,
        createdAt: true,
        slot: {
          select: {
            date: true,
            startTime: true,
            endTime: true,
            counselor: { select: { id: true, name: true, specialization: true } },
          },
        },
        report: { select: { id: true, approvalStatus: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(bookings.map((booking) => ({
      ...booking,
      meetingLink:
        !booking.cancelledAt &&
        (booking.isFreeSession || booking.paymentStatus === PaymentStatus.PAID)
          ? booking.meetingLink
          : null,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.post('/:id/cancellation', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can request booking cancellation' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { slot: true },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.studentId !== req.user!.userId) return res.status(403).json({ error: 'Unauthorized' });
    if (booking.paymentStatus !== 'PAID' || booking.cancelledAt) {
      return res.status(409).json({ error: 'Only active, confirmed bookings can be cancelled' });
    }
    if (!counselingSlotIsInFuture(booking.slot.date, booking.slot.startTime)) {
      return res.status(409).json({ error: 'Cancellation requests must be submitted before the session starts' });
    }
    if (booking.cancellationStatus === 'REQUESTED') {
      return res.status(409).json({ error: 'A cancellation request is already awaiting review' });
    }
    if (booking.cancellationStatus === 'APPROVED') {
      return res.status(409).json({ error: 'This booking has already been cancelled' });
    }

    const updated = await prisma.booking.updateMany({
      where: {
        id: booking.id,
        studentId: req.user!.userId,
        paymentStatus: 'PAID',
        cancellationStatus: booking.cancellationStatus,
        cancelledAt: null,
      },
      data: {
        cancellationStatus: 'REQUESTED',
        cancellationRequestedAt: new Date(),
        cancellationReviewedAt: null,
        cancellationReviewNote: null,
      },
    });
    if (updated.count !== 1) {
      return res.status(409).json({ error: 'Booking status changed. Refresh and try again.' });
    }

    return res.json({
      message: 'Cancellation request submitted. An administrator will review it; any eligible refund is handled manually.',
      cancellationStatus: 'REQUESTED',
    });
  } catch (error) {
    console.error('Booking cancellation request failed:', error);
    return res.status(500).json({ error: 'Could not submit cancellation request' });
  }
});

router.get('/eligibility', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Counseling eligibility is only available to students' });
    }
    const student = await prisma.user.findUnique({
      where: { id: (req as any).user.userId },
      select: { hasUsedFreeSession: true, marksPercentage: true },
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    return res.json(student);
  } catch (error) {
    console.error('Failed to fetch counseling eligibility:', error);
    return res.status(500).json({ error: 'Failed to fetch counseling eligibility' });
  }
});

// GET: Get specific booking by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, role } = (req as any).user;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
        isFreeSession: true,
        paymentStatus: true,
        cancellationStatus: true,
        cancellationReviewNote: true,
        cancelledAt: true,
        razorpayOrderId: true,
        razorpayPaymentId: true,
        studentPaymentEmailSentAt: true,
        counselorPaymentEmailSentAt: true,
        createdAt: true,
        amount: true,
        marksPercentage: true,
        educationBackground: true,
        currentStream: true,
        careerAspiration: true,
        areasOfInterest: true,
        subjectPreferences: true,
        hobbies: true,
        sessionChecklistAnswers: true,
        sessionChecklistCompletedAt: true,
        slot: {
          select: {
            id: true,
            counselorId: true,
            date: true,
            startTime: true,
            endTime: true,
            counselor: { select: { id: true, name: true, specialization: true } },
          },
        },
        report: { select: { id: true, approvalStatus: true, createdAt: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization
    const counselorId =
      role === 'COUNSELOR' ? await getCounselorProfileIdForUser(prisma, userId) : null;
    if (
      (role === 'STUDENT' && booking.studentId !== userId) ||
      (role === 'COUNSELOR' && (!counselorId || booking.slot.counselorId !== counselorId)) ||
      !['STUDENT', 'COUNSELOR', 'ADMIN'].includes(role)
    ) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// PUT: Submit post-booking form details
router.put('/:id/details', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can update booking details' });
    }
    const { id } = req.params;
    const studentId = (req as any).user.userId;
    const {
      educationBackground,
      currentStream,
      careerAspiration,
      areasOfInterest,
      subjectPreferences,
      hobbies,
      studentName,
      studentAge,
      schoolCollege,
      fatherName,
      fatherAge,
      fatherOccupation,
      fatherEducation,
      motherName,
      motherAge,
      motherOccupation,
      motherEducation,
      AnnualfamilyIncome,
      familyType,
      address,
      phoneNo,
      emailId,
      subjectAssessments,
    } = req.body;

    const ages = [studentAge, fatherAge, motherAge];
    if (
      ages.some(
        (age) =>
          age !== undefined &&
          age !== null &&
          age !== '' &&
          (!Number.isInteger(Number(age)) || Number(age) < 1 || Number(age) > 120)
      )
    ) {
      return res.status(400).json({ error: 'Ages must be whole numbers between 1 and 120' });
    }

    if (
      subjectAssessments !== undefined &&
      (!Array.isArray(subjectAssessments) ||
        subjectAssessments.some(
          (assessment) =>
            !assessment ||
            typeof assessment.subject !== 'string' ||
            typeof assessment.overall !== 'string' ||
            typeof assessment.comments !== 'string'
        ))
    ) {
      return res.status(400).json({ error: 'Subject assessments are invalid' });
    }

    const normalizedIncome =
      AnnualfamilyIncome === undefined
        ? undefined
        : AnnualfamilyIncome === null || AnnualfamilyIncome === ''
          ? null
          : Number(AnnualfamilyIncome);
    if (
      normalizedIncome !== undefined &&
      normalizedIncome !== null &&
      (!Number.isInteger(normalizedIncome) || normalizedIncome < 0)
    ) {
      return res.status(400).json({ error: 'Annual family income must be a non-negative whole number' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization
    if (booking.studentId !== studentId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        educationBackground,
        currentStream,
        careerAspiration,
        areasOfInterest,
        subjectPreferences,
        hobbies,
        studentName,
        studentAge: normalizeOptionalAge(studentAge),
        schoolCollege,
        fatherName,
        fatherAge: normalizeOptionalAge(fatherAge),
        fatherOcuupation: fatherOccupation,
        fatherEducation,
        motherName,
        motherAge: normalizeOptionalAge(motherAge),
        motherOcuupation: motherOccupation,
        motherEducation,
        AnnualfamilyIncome: normalizedIncome,
        familyType,
        address,
        phoneNo,
        emailId,
        subjectAssessments,
      },
    });

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking details' });
  }
});

// GET: Get an approved report for its student, or any report for its counselor/admin.
router.get('/:id/report', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, role } = (req as any).user;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { slot: true, report: true },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check authorization
    const counselorId =
      role === 'COUNSELOR' ? await getCounselorProfileIdForUser(prisma, userId) : null;
    if (
      (role === 'STUDENT' && booking.studentId !== userId) ||
      (role === 'COUNSELOR' &&
        (!counselorId || booking.slot.counselorId !== counselorId)) ||
      !['STUDENT', 'COUNSELOR', 'ADMIN'].includes(role)
    ) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!booking.report) {
      return res.status(404).json({ error: 'Report not yet generated' });
    }
    if (role === 'STUDENT' && booking.report.approvalStatus !== 'APPROVED') {
      return res.status(404).json({ error: 'Report is not available yet' });
    }

    res.json(booking.report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

export default router;
