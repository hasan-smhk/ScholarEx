import express, { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  COUNSELING_SLOTS,
  counselingSlotIsInFuture,
  isCounselingSlot,
  releaseExpiredCounselingReservations,
} from '../services/counselingSchedule';
import authMiddleware from '../middlewares/auth.middleware';
import { getCounselorProfileIdForUser } from '../services/counselorAccess.service';
import { sendSessionLinkEmail } from '../services/sessionLinkEmail.service';
import { isCompleteCounselingChecklist } from '../services/counselingChecklist';

const router = express.Router();
const prisma = new PrismaClient();

const counselorOnly = async (req: Request, res: Response, next: Function) => {
  if (req.user?.role !== 'COUNSELOR') {
    return res.status(403).json({ error: 'Counselor access required' });
  }
  try {
    const counselorId = await getCounselorProfileIdForUser(prisma, req.user.userId);
    if (!counselorId) {
      return res.status(403).json({ error: 'Counselor access is available only after administrator approval' });
    }
  } catch (error) {
    console.error('Counselor approval check failed:', error);
    return res.status(500).json({ error: 'Could not verify counselor access' });
  }
  next();
};

function getStartOfTodayUtc(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

router.get('/me', authMiddleware, counselorOnly, async (req: Request, res: Response) => {
  try {
    const counselorId = await getCounselorProfileIdForUser(prisma, req.user!.userId);
    if (!counselorId) return res.status(404).json({ error: 'Counselor profile not found' });

    const counselor = await prisma.counselor.findUnique({
      where: { id: counselorId },
      include: { experience: true, certificationEnrollment: true },
    });
    if (!counselor) return res.status(404).json({ error: 'Counselor profile not found' });
    res.json(counselor);
  } catch (error) {
    console.error('Counselor profile fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch counselor profile' });
  }
});

router.patch('/me', authMiddleware, counselorOnly, async (req: Request, res: Response) => {
  try {
    const counselorId = await getCounselorProfileIdForUser(prisma, req.user!.userId);
    if (!counselorId) return res.status(404).json({ error: 'Counselor profile not found' });

    const { name, mobileNumber, professionalQualifications, specialization, description, yearsExperience, experienceDetails, certificationDetails } = req.body;
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedMobile = typeof mobileNumber === 'string' ? mobileNumber.trim() : '';
    const mobileDigits = normalizedMobile.replace(/\D/g, '');
    const qualifications = typeof professionalQualifications === 'string' ? professionalQualifications.trim() : '';
    const normalizedSpecialization = typeof specialization === 'string' ? specialization.trim() : '';
    const experience = Number(yearsExperience);
    const details = typeof experienceDetails === 'string' ? experienceDetails.trim() : '';
    const certificateDetails = typeof certificationDetails === 'string' ? certificationDetails.trim() : '';

    if (!normalizedName || normalizedName.length > 120) {
      return res.status(400).json({ error: 'Enter a valid full name' });
    }
    if (mobileDigits.length < 10 || mobileDigits.length > 15 || normalizedMobile.length > 32) {
      return res.status(400).json({ error: 'Enter a valid mobile number with 10 to 15 digits' });
    }
    if (!qualifications || qualifications.length > 2000 || !normalizedSpecialization || normalizedSpecialization.length > 120) {
      return res.status(400).json({ error: 'Professional qualifications and specialization are required' });
    }
    if (!Number.isInteger(experience) || experience < 0 || experience > 80 || (experience > 1 && (details.length < 2 || details.length > 2000))) {
      return res.status(400).json({ error: 'Provide valid professional experience details' });
    }
    if (certificateDetails.length > 2000 || (certificateDetails && certificateDetails.length < 2)) {
      return res.status(400).json({ error: 'Certification details must contain 2 to 2000 characters' });
    }

    const currentProfile = await prisma.counselor.findUnique({
      where: { id: counselorId },
      select: { certificationDetails: true, certificationStatus: true },
    });
    if (!currentProfile) return res.status(404).json({ error: 'Counselor profile not found' });
    const certificationChanged = (currentProfile.certificationDetails || '') !== certificateDetails;
    const updated = await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: req.user!.userId },
        data: { name: normalizedName },
      });
      const profile = await transaction.counselor.update({
        where: { id: counselorId },
        data: {
          name: normalizedName,
          mobileNumber: normalizedMobile,
          professionalQualifications: qualifications,
          specialization: normalizedSpecialization,
          description: typeof description === 'string' ? description.trim().slice(0, 2000) : null,
          certificationDetails: certificateDetails || null,
          ...(certificationChanged
            ? {
                certificationStatus: certificateDetails ? 'PENDING_VERIFICATION' : 'NOT_PROVIDED',
                certificationVerifiedAt: null,
                certificationVerifiedById: null,
              }
            : {}),
        },
        include: { experience: true, certificationEnrollment: true },
      });
      await transaction.counselorExperience.upsert({
        where: { counselorId },
        create: { counselorId, yearsExperience: experience, details: experience > 1 ? details : null },
        update: { yearsExperience: experience, details: experience > 1 ? details : null },
      });
      return profile;
    });
    res.json(updated);
  } catch (error) {
    console.error('Counselor profile update failed:', error);
    res.status(500).json({ error: 'Failed to update counselor profile' });
  }
});

router.post('/me/certification-enrollment', authMiddleware, counselorOnly, async (req: Request, res: Response) => {
  try {
    const counselorId = await getCounselorProfileIdForUser(prisma, req.user!.userId);
    if (!counselorId) return res.status(404).json({ error: 'Counselor profile not found' });
    const existingEnrollment = await prisma.counselorCertificationEnrollment.findUnique({
      where: { counselorId },
    });
    if (existingEnrollment) {
      return res.status(409).json({ error: 'You are already enrolled in the ScholarEx counsellor certification programme' });
    }
    const enrollment = await prisma.counselorCertificationEnrollment.create({
      data: { counselorId },
    });
    res.status(201).json(enrollment);
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return res.status(409).json({ error: 'You are already enrolled in the ScholarEx counsellor certification programme' });
    }
    console.error('Counselor certification enrollment failed:', error);
    res.status(500).json({ error: 'Failed to enrol in the certification programme' });
  }
});

router.get('/me/bookings', authMiddleware, counselorOnly, async (req: Request, res: Response) => {
  try {
    const counselorId = await getCounselorProfileIdForUser(prisma, req.user!.userId);
    if (!counselorId) return res.status(404).json({ error: 'Counselor profile not found' });
    const bookings = await prisma.booking.findMany({
      where: { slot: { counselorId } },
      select: {
        id: true,
        isFreeSession: true,
        paymentStatus: true,
        cancellationStatus: true,
        cancelledAt: true,
        amount: true,
        meetingLink: true,
        meetingLinkEmailSentAt: true,
        sessionChecklistAnswers: true,
        sessionChecklistCompletedAt: true,
        marksPercentage: true,
        studentName: true,
        studentAge: true,
        schoolCollege: true,
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
        address: true,
        phoneNo: true,
        emailId: true,
        educationBackground: true,
        currentStream: true,
        careerAspiration: true,
        areasOfInterest: true,
        subjectPreferences: true,
        hobbies: true,
        subjectAssessments: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            careerAssessment: {
              select: {
                studentClass: true,
                schoolCollege: true,
                phoneNumber: true,
                educationBoard: true,
                academicPerformance: true,
                strongSubjects: true,
                dislikedSubjects: true,
                hobbies: true,
                strengths: true,
                improvementAreas: true,
                coursesOfInterest: true,
                learningStyle: true,
                likes: true,
                dislikes: true,
                careerGoal: true,
                parentsAspiration: true,
              },
            },
          },
        },
        slot: { select: { id: true, date: true, startTime: true, endTime: true } },
        report: { select: { createdAt: true, approvalStatus: true } },
      },
      orderBy: [{ slot: { date: 'desc' } }, { createdAt: 'desc' }],
    });
    res.json(bookings);
  } catch (error) {
    console.error('Counselor booking fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch assigned appointments' });
  }
});

router.put('/me/bookings/:bookingId/checklist', authMiddleware, counselorOnly, async (req: Request, res: Response) => {
  try {
    const counselorId = await getCounselorProfileIdForUser(prisma, req.user!.userId);
    if (!counselorId) return res.status(404).json({ error: 'Counselor profile not found' });

    const { answers } = req.body;
    if (!isCompleteCounselingChecklist(answers) || JSON.stringify(answers).length > 50000) {
      return res.status(400).json({ error: 'Answer every checklist question with no more than 3,000 characters per answer' });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: req.params.bookingId, slot: { counselorId } },
      select: {
        id: true,
        cancelledAt: true,
        isFreeSession: true,
        paymentStatus: true,
        meetingLink: true,
        meetingLinkEmailSentAt: true,
        slot: { select: { date: true, startTime: true } },
      },
    });
    if (!booking) return res.status(404).json({ error: 'Assigned appointment not found' });
    if (booking.cancelledAt) {
      return res.status(409).json({ error: 'The checklist cannot be completed for a cancelled appointment' });
    }
    if (!booking.isFreeSession && booking.paymentStatus !== 'PAID') {
      return res.status(402).json({ error: 'Complete payment before recording session answers' });
    }
    if (!booking.meetingLink || !booking.meetingLinkEmailSentAt) {
      return res.status(409).json({ error: 'The session link must be sent to the student before recording answers' });
    }
    if (counselingSlotIsInFuture(booking.slot.date, booking.slot.startTime)) {
      return res.status(409).json({ error: 'The counselor checklist is available when the session starts' });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        sessionChecklistAnswers: answers as Prisma.InputJsonValue,
        sessionChecklistCompletedAt: new Date(),
      },
      select: {
        id: true,
        sessionChecklistAnswers: true,
        sessionChecklistCompletedAt: true,
      },
    });
    return res.json(updated);
  } catch (error) {
    console.error('Counseling session checklist save failed:', error);
    return res.status(500).json({ error: 'Failed to save counseling session answers' });
  }
});

router.patch('/me/bookings/:bookingId/meeting-link', authMiddleware, counselorOnly, async (req: Request, res: Response) => {
  try {
    const counselorId = await getCounselorProfileIdForUser(prisma, req.user!.userId);
    if (!counselorId) return res.status(404).json({ error: 'Counselor profile not found' });
    const meetingLink = typeof req.body.meetingLink === 'string' ? req.body.meetingLink.trim() : '';
    if (meetingLink) {
      try {
        const url = new URL(meetingLink);
        const hostname = url.hostname.toLowerCase();
        const isSupportedProvider =
          hostname === 'meet.google.com' ||
          hostname === 'zoom.us' ||
          hostname.endsWith('.zoom.us');
        if (url.protocol !== 'https:' || !isSupportedProvider) throw new Error('unsupported provider');
      } catch {
        return res.status(400).json({ error: 'Enter a valid HTTPS Zoom or Google Meet link' });
      }
    }
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.bookingId, slot: { counselorId } },
      select: {
        id: true,
        cancelledAt: true,
        meetingLink: true,
        meetingLinkEmailSentAt: true,
        isFreeSession: true,
        paymentStatus: true,
      },
    });
    if (!booking) return res.status(404).json({ error: 'Assigned appointment not found' });
    if (booking.cancelledAt) {
      return res.status(409).json({ error: 'Meeting links cannot be changed for a cancelled appointment' });
    }
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        meetingLink: meetingLink || null,
        ...(meetingLink !== booking.meetingLink ? { meetingLinkEmailSentAt: null } : {}),
      },
      select: { id: true, meetingLink: true },
    });
    const meetingLinkEmailDeferred =
      Boolean(meetingLink) && !booking.isFreeSession && booking.paymentStatus !== 'PAID';
    const meetingLinkEmailSent = meetingLink && !meetingLinkEmailDeferred
      ? await sendSessionLinkEmail(booking.id)
      : false;
    res.json({ ...updated, meetingLinkEmailSent, meetingLinkEmailDeferred });
  } catch (error) {
    console.error('Counselor meeting link update failed:', error);
    res.status(500).json({ error: 'Failed to update meeting link' });
  }
});

router.get('/me/slots', authMiddleware, counselorOnly, async (req: Request, res: Response) => {
  try {
    const counselorId = await getCounselorProfileIdForUser(prisma, req.user!.userId);
    if (!counselorId) return res.status(404).json({ error: 'Counselor profile not found' });
    await releaseExpiredCounselingReservations(prisma);
    const slots = await prisma.slot.findMany({
      where: {
        counselorId,
        date: { gte: getStartOfTodayUtc() },
        OR: [{ isAvailable: true }, { isBooked: true }],
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    res.json(slots.filter((slot) => isCounselingSlot(slot.date, slot.startTime, slot.endTime)
      && counselingSlotIsInFuture(slot.date, slot.startTime)));
  } catch (error) {
    console.error('Counselor availability fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch counselor availability' });
  }
});

router.put('/me/availability', authMiddleware, counselorOnly, async (req: Request, res: Response) => {
  try {
    const counselorId = await getCounselorProfileIdForUser(prisma, req.user!.userId);
    if (!counselorId) return res.status(404).json({ error: 'Counselor profile not found' });

    const { date: dateValue, startTimes } = req.body as { date?: unknown; startTimes?: unknown };
    if (typeof dateValue !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !Array.isArray(startTimes)) {
      return res.status(400).json({ error: 'Choose a valid date and availability times' });
    }

    const date = new Date(`${dateValue}T00:00:00.000Z`);
    if (date.toISOString().slice(0, 10) !== dateValue) {
      return res.status(400).json({ error: 'Choose a valid date' });
    }
    if (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
      return res.status(400).json({ error: 'Availability can only be set for weekdays' });
    }
    const allowedStartTimes = new Set(COUNSELING_SLOTS.map((slot) => slot.startTime));
    if (startTimes.some((time) => typeof time !== 'string' || !allowedStartTimes.has(time))) {
      return res.status(400).json({ error: 'Availability must be between 5:00 PM and 8:00 PM' });
    }
    const selectedTimes = [...new Set(startTimes as string[])];
    if (selectedTimes.some((time) => !counselingSlotIsInFuture(date, time))) {
      return res.status(400).json({ error: 'Availability must be set for a future time' });
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.slot.updateMany({
        where: {
          counselorId,
          date,
          isAvailable: true,
          ...(selectedTimes.length ? { startTime: { notIn: selectedTimes } } : {}),
        },
        data: { isAvailable: false },
      });

      for (const startTime of selectedTimes) {
        const slot = COUNSELING_SLOTS.find((candidate) => candidate.startTime === startTime)!;
        await transaction.slot.upsert({
          where: {
            counselorId_date_startTime_endTime: {
              counselorId,
              date,
              startTime: slot.startTime,
              endTime: slot.endTime,
            },
          },
          update: { isAvailable: true },
          create: { counselorId, date, ...slot, isAvailable: true },
        });
      }
    });

    const slots = await prisma.slot.findMany({
      where: {
        counselorId,
        date: { gte: getStartOfTodayUtc() },
        OR: [{ isAvailable: true }, { isBooked: true }],
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    res.json(slots.filter((slot) =>
      isCounselingSlot(slot.date, slot.startTime, slot.endTime) &&
      counselingSlotIsInFuture(slot.date, slot.startTime)
    ));
  } catch (error) {
    console.error('Counselor availability update failed:', error);
    res.status(500).json({ error: 'Failed to update counselor availability' });
  }
});

// GET all counselors
router.get('/', async (req: Request, res: Response) => {
  try {
    await releaseExpiredCounselingReservations(prisma);
    const today = getStartOfTodayUtc();
    const counselors = await prisma.counselor.findMany({
      where: { approvalStatus: 'APPROVED' },
      select: {
        id: true,
        name: true,
        specialization: true,
        description: true,
        sessionFee: true,
        slots: {
          where: {
            isAvailable: true,
            isBooked: false,
            date: { gte: today },
          },
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        },
      },
    });
    res.json(
      counselors.map((counselor) => ({
        ...counselor,
        slots: counselor.slots.filter(
          (slot) =>
            isCounselingSlot(slot.date, slot.startTime, slot.endTime) &&
            counselingSlotIsInFuture(slot.date, slot.startTime)
        ),
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch counselors' });
  }
});

// GET counselor by ID with available slots
router.get('/:id', async (req: Request, res: Response) => {
  try {
    await releaseExpiredCounselingReservations(prisma);
    const { id } = req.params;
    const today = getStartOfTodayUtc();
    const counselor = await prisma.counselor.findFirst({
      where: { id, approvalStatus: 'APPROVED' },
      select: {
        id: true,
        name: true,
        specialization: true,
        description: true,
        sessionFee: true,
        slots: {
          where: {
            isAvailable: true,
            isBooked: false,
            date: { gte: today },
          },
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        },
      },
    });
    if (!counselor) {
      return res.status(404).json({ error: 'Counselor not found' });
    }
    res.json({
      ...counselor,
      slots: counselor.slots.filter(
        (slot) =>
          isCounselingSlot(slot.date, slot.startTime, slot.endTime) &&
          counselingSlotIsInFuture(slot.date, slot.startTime)
      ),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch counselor' });
  }
});

// GET available slots for a counselor
router.get('/:id/slots', async (req: Request, res: Response) => {
  try {
    await releaseExpiredCounselingReservations(prisma);
    const { id } = req.params;
    const today = getStartOfTodayUtc();
    const slots = await prisma.slot.findMany({
      where: {
        counselorId: id,
        counselor: { approvalStatus: 'APPROVED' },
        isAvailable: true,
        isBooked: false,
        date: { gte: today },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    res.json(
      slots.filter(
        (slot) =>
          isCounselingSlot(slot.date, slot.startTime, slot.endTime) &&
          counselingSlotIsInFuture(slot.date, slot.startTime)
      )
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

export default router;
