import express, { Request, Response } from 'express';
import { PrismaClient, PaymentStatus } from '@prisma/client';
import authMiddleware from '../middlewares/auth.middleware';
import {
  counselingSlotIsInFuture,
  ensureCounselingSchedule,
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
    const intake = req.body as Record<string, unknown>;
    const studentId = (req as any).user.userId;
    const preferredCounselorId =
      typeof intake.preferredCounselorId === 'string' ? intake.preferredCounselorId : undefined;
    const marksPercentage = Number(intake.marksPercentage);

    const requiredFields = [
      'studentName',
      'schoolCollege',
      'familyType',
      'address',
      'phoneNo',
      'emailId',
      'educationBackground',
      'currentStream',
      'careerAspiration',
    ];
    if (
      requiredFields.some(
        (field) => typeof intake[field] !== 'string' || !(intake[field] as string).trim()
      ) ||
      [intake.studentAge, intake.fatherAge, intake.motherAge].some(
        (age, index) =>
          (index === 0 || (age !== undefined && age !== null && age !== '')) &&
          (!Number.isInteger(Number(age)) || Number(age) < 1 || Number(age) > 120)
      )
    ) {
      return res.status(400).json({ error: 'Complete all required counseling form fields' });
    }

    if (!Number.isFinite(marksPercentage) || marksPercentage < 0 || marksPercentage > 100) {
      return res.status(400).json({ error: 'Marks percentage must be between 0 and 100' });
    }
    const annualFamilyIncome = Number(intake.AnnualfamilyIncome);
    if (!Number.isInteger(annualFamilyIncome) || annualFamilyIncome < 0) {
      return res.status(400).json({ error: 'Annual family income must be a non-negative whole number' });
    }

    if (
      intake.subjectAssessments !== undefined &&
      (!Array.isArray(intake.subjectAssessments) ||
        intake.subjectAssessments.some(
          (assessment) =>
            !assessment ||
            typeof assessment.subject !== 'string' ||
            typeof assessment.overall !== 'string' ||
            typeof assessment.comments !== 'string'
        ))
    ) {
      return res.status(400).json({ error: 'Subject assessments are invalid' });
    }

    await releaseExpiredCounselingReservations(prisma);
    await ensureCounselingSchedule(prisma);
    const excludedSlotIds = new Set<string>();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const availableSlots = await prisma.slot.findMany({
        where: { isBooked: false, counselor: { approvalStatus: 'APPROVED' } },
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
          const student = await transaction.user.findUnique({ where: { id: studentId } });
          if (!student) throw new Error('STUDENT_NOT_FOUND');

          const reserved = await transaction.slot.updateMany({
            where: { id: slot.id, isBooked: false },
            data: { isBooked: true },
          });
          if (reserved.count !== 1) throw new Error('SLOT_UNAVAILABLE');

          const isFreeSession = !student.hasUsedFreeSession;
          if (isFreeSession) {
            const freeSessionClaim = await transaction.user.updateMany({
              where: { id: studentId, hasUsedFreeSession: false },
              data: { hasUsedFreeSession: true },
            });
            if (freeSessionClaim.count !== 1) throw new Error('SLOT_UNAVAILABLE');
          }

          await transaction.user.update({
            where: { id: studentId },
            data: { marksPercentage },
          });

          return transaction.booking.create({
            data: {
              studentId,
              slotId: slot.id,
              isFreeSession,
              paymentStatus: isFreeSession ? PaymentStatus.PAID : PaymentStatus.PENDING,
              amount: isFreeSession ? 0 : slot.counselor.sessionFee,
              marksPercentage,
              educationBackground: intake.educationBackground as string,
              currentStream: intake.currentStream as string,
              careerAspiration: intake.careerAspiration as string,
              areasOfInterest: typeof intake.areasOfInterest === 'string' ? intake.areasOfInterest : null,
              subjectPreferences:
                typeof intake.subjectPreferences === 'string'
                  ? intake.subjectPreferences
                  : Array.isArray(intake.subjectAssessments)
                    ? intake.subjectAssessments.map((assessment) => assessment.subject).join(', ')
                    : null,
              hobbies: typeof intake.hobbies === 'string' ? intake.hobbies : null,
              studentName: intake.studentName as string,
              studentAge: Number(intake.studentAge),
              schoolCollege: intake.schoolCollege as string,
              fatherName: typeof intake.fatherName === 'string' ? intake.fatherName : null,
              fatherAge: normalizeOptionalAge(intake.fatherAge),
              fatherOcuupation:
                typeof intake.fatherOccupation === 'string' ? intake.fatherOccupation : null,
              fatherEducation:
                typeof intake.fatherEducation === 'string' ? intake.fatherEducation : null,
              motherName: typeof intake.motherName === 'string' ? intake.motherName : null,
              motherAge: normalizeOptionalAge(intake.motherAge),
              motherOcuupation:
                typeof intake.motherOccupation === 'string' ? intake.motherOccupation : null,
              motherEducation:
                typeof intake.motherEducation === 'string' ? intake.motherEducation : null,
              AnnualfamilyIncome: annualFamilyIncome,
              familyType: intake.familyType as string,
              address: intake.address as string,
              phoneNo: intake.phoneNo as string,
              emailId: intake.emailId as string,
              subjectAssessments: Array.isArray(intake.subjectAssessments)
                ? intake.subjectAssessments
                : undefined,
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
    const studentId = (req as any).user.userId;

    const bookings = await prisma.booking.findMany({
      where: { studentId },
      select: {
        id: true,
        isFreeSession: true,
        paymentStatus: true,
        amount: true,
        marksPercentage: true,
        meetingLink: true,
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

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.get('/eligibility', authMiddleware, async (req: Request, res: Response) => {
  try {
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
        amount: true,
        marksPercentage: true,
        educationBackground: true,
        currentStream: true,
        careerAspiration: true,
        areasOfInterest: true,
        subjectPreferences: true,
        hobbies: true,
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
