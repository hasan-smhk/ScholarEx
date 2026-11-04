import express, { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import authMiddleware from '../middlewares/auth.middleware';
import {
  sendEmail,
  reportApprovedEmail,
  reportCreatedNotificationEmail,
} from '../services/email.service';
import {
  CounselingReportConfigurationError,
  CounselingReportInputError,
  CounselingReportProviderError,
  generateCounselingReport,
  isCounselingReportProfileScores,
} from '../services/aiCounselingReport.service';
import { getCounselorProfileIdForUser } from '../services/counselorAccess.service';
import {
  COUNSELING_CHECKLIST_QUESTION_IDS,
  isCompleteCounselingChecklist,
} from '../services/counselingChecklist';

const router = express.Router();
const prisma = new PrismaClient();

// ─── Middleware: Check if user is counselor or admin ──────────────────────────
const counselorOrAdmin = async (req: Request, res: Response, next: Function) => {
  const role = (req as any).user?.role;
  if (role !== 'COUNSELOR' && role !== 'ADMIN') {
    return res.status(403).json({ error: 'Counselor access required' });
  }
  if (role === 'COUNSELOR') {
    try {
      const counselorId = await getCounselorProfileIdForUser(prisma, (req as any).user.userId);
      if (!counselorId) {
        return res.status(403).json({ error: 'Counselor access is available only after administrator approval' });
      }
    } catch (error) {
      console.error('Counselor approval check failed:', error);
      return res.status(500).json({ error: 'Could not verify counselor access' });
    }
  }
  next();
};

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE / UPDATE REPORT
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/', authMiddleware, counselorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { bookingId, strengths, areasOfImprovement, recommendations, nextSteps } = req.body;
    const { userId, role } = (req as any).user;

    if (
      typeof bookingId !== 'string' ||
      ['strengths', 'areasOfImprovement', 'recommendations', 'nextSteps'].some(
        (field) => typeof req.body[field] !== 'string' || !req.body[field].trim()
      )
    ) {
      return res.status(400).json({ error: 'Booking ID and all report sections are required' });
    }
    if (req.body.profileScores !== undefined && !isCounselingReportProfileScores(req.body.profileScores)) {
      return res.status(400).json({ error: 'AI report reflection scores are invalid' });
    }
    const profileScores = req.body.profileScores as Prisma.InputJsonValue | undefined;

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        slot: {
          include: {
            counselor: { select: { id: true, name: true, email: true, specialization: true } },
          },
        },
        student: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.cancelledAt) {
      return res.status(409).json({ error: 'Reports cannot be submitted for a cancelled booking' });
    }
    if (!booking.isFreeSession && booking.paymentStatus !== 'PAID') {
      return res.status(402).json({ error: 'Complete payment before submitting a report' });
    }

    // Check if counselor matches (if not admin)
    const counselorId =
      role === 'COUNSELOR' ? await getCounselorProfileIdForUser(prisma, userId) : null;
    if (role === 'COUNSELOR' && (!counselorId || booking.slot.counselorId !== counselorId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    // Check if report already exists
    const existingReport = await prisma.report.findUnique({
      where: { bookingId },
    });
    if (role === 'ADMIN' && !existingReport) {
      return res.status(409).json({ error: 'A counselor must submit and approve the report before admin review' });
    }
    if (
      role === 'COUNSELOR' &&
      (!booking.sessionChecklistCompletedAt || !isCompleteCounselingChecklist(booking.sessionChecklistAnswers))
    ) {
      return res.status(409).json({ error: 'Complete the counselor session checklist before submitting a report' });
    }

    let report;
    let isNewReport = false;

    if (existingReport) {
      // Update existing report
      report = await prisma.report.update({
        where: { bookingId },
        data: {
          strengths,
          areasOfImprovement,
          recommendations,
          nextSteps,
          profileScores,
          approvalStatus: role === 'COUNSELOR'
            ? 'COUNSELOR_REVIEW'
            : existingReport.approvalStatus === 'COUNSELOR_REVIEW'
              ? 'COUNSELOR_REVIEW'
              : 'PENDING_REVIEW',
          isAiGenerated: req.body.isAiGenerated === true,
          reviewedAt: null,
          reviewedById: null,
          reviewNote: null,
          emailSentAt: null,
          ...(role === 'COUNSELOR'
            ? { counselorReviewedAt: null, counselorReviewedById: null }
            : {}),
        },
      });
    } else {
      // Create new report
      report = await prisma.report.create({
        data: {
          bookingId,
          studentId: booking.studentId,
          strengths,
          areasOfImprovement,
          recommendations,
          nextSteps,
          profileScores,
          isAiGenerated: req.body.isAiGenerated === true,
          approvalStatus: 'COUNSELOR_REVIEW',
        },
      });
      isNewReport = true;
    }

    // A student receives the report only after an administrator approves it.
    if (isNewReport) {
      try {
        await sendEmail({
          to: booking.slot.counselor.email,
          subject: `Counselling report submitted for review`,
          html: reportCreatedNotificationEmail(
            booking.slot.counselor.name,
            booking.student.name,
            `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking/${bookingId}/report`
          ),
        });
      } catch (emailError) {
        console.error('❌ Failed to send counselor confirmation:', emailError);
      }
    }

    res.status(isNewReport ? 201 : 200).json({
      message: 'Report saved for counselor review',
      report,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

router.post('/:bookingId/generate', authMiddleware, counselorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, role } = (req as any).user;
    if (role !== 'COUNSELOR') {
      return res.status(403).json({ error: 'Only the assigned counselor can generate the session report' });
    }
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: { slot: { include: { counselor: true } } },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.cancelledAt) {
      return res.status(409).json({ error: 'Reports cannot be generated for a cancelled booking' });
    }
    const counselorId =
      role === 'COUNSELOR' ? await getCounselorProfileIdForUser(prisma, userId) : null;
    if (role === 'COUNSELOR' && (!counselorId || booking.slot.counselorId !== counselorId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (!booking.isFreeSession && booking.paymentStatus !== 'PAID') {
      return res.status(402).json({ error: 'Complete payment before generating a report' });
    }
    if (!booking.sessionChecklistCompletedAt || !isCompleteCounselingChecklist(booking.sessionChecklistAnswers)) {
      return res.status(409).json({ error: 'Complete the counselor session checklist before generating a report' });
    }

    const draft = await generateCounselingReport({
      specialization: booking.slot.counselor.specialization,
      educationBackground: booking.educationBackground,
      currentStream: booking.currentStream,
      careerAspiration: booking.careerAspiration,
      areasOfInterest: booking.areasOfInterest,
      subjectPreferences: booking.subjectPreferences,
      hobbies: booking.hobbies,
      marksPercentage: booking.marksPercentage,
      subjectAssessments: booking.subjectAssessments,
      sessionChecklistAnswers: booking.sessionChecklistAnswers,
    });
    res.json(draft);
  } catch (error) {
    console.error('AI counselling report generation failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate report draft';
    const status =
      error instanceof CounselingReportInputError
        ? 400
        : error instanceof CounselingReportConfigurationError
          ? 503
          : error instanceof CounselingReportProviderError
            ? 502
            : 500;
    res.status(status).json({ error: message });
  }
});

router.put('/:reportId/checklist', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { role } = (req as any).user;
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { answers } = req.body;
    if (!isCompleteCounselingChecklist(answers) || JSON.stringify(answers).length > 50000) {
      return res.status(400).json({
        error: 'Answer every checklist question with no more than 3,000 characters per answer',
      });
    }

    const report = await prisma.report.findUnique({
      where: { id: req.params.reportId },
      include: {
        booking: {
          select: {
            id: true,
            sessionChecklistAnswers: true,
          },
        },
      },
    });
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const previousAnswers =
      report.booking.sessionChecklistAnswers && typeof report.booking.sessionChecklistAnswers === 'object'
        ? report.booking.sessionChecklistAnswers as Record<string, unknown>
        : {};
    const changed = COUNSELING_CHECKLIST_QUESTION_IDS.some((id) => previousAnswers[id] !== answers[id]);

    const result = await prisma.$transaction(async (transaction) => {
      const booking = await transaction.booking.update({
        where: { id: report.booking.id },
        data: {
          sessionChecklistAnswers: answers as Prisma.InputJsonValue,
          sessionChecklistCompletedAt: new Date(),
        },
        select: { sessionChecklistAnswers: true, sessionChecklistCompletedAt: true },
      });

      const updatedReport = changed
        ? await transaction.report.update({
            where: { id: report.id },
            data: {
              strengths: null,
              areasOfImprovement: null,
              recommendations: null,
              nextSteps: null,
              profileScores: Prisma.DbNull,
              isAiGenerated: false,
              approvalStatus: 'COUNSELOR_REVIEW',
              counselorReviewedAt: null,
              counselorReviewedById: null,
              reviewedAt: null,
              reviewedById: null,
              reviewNote: null,
              emailSentAt: null,
            },
            select: { id: true, approvalStatus: true, emailSentAt: true, reviewNote: true },
          })
        : {
            id: report.id,
            approvalStatus: report.approvalStatus,
            emailSentAt: report.emailSentAt,
            reviewNote: report.reviewNote,
          };

      return { booking, report: updatedReport };
    });

    return res.json({ ...result, changed });
  } catch (error) {
    console.error('Admin counseling checklist update failed:', error);
    return res.status(500).json({ error: 'Failed to update checklist answers' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET: Get report for a booking
router.get('/booking/:bookingId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { userId, role } = (req as any).user;

    const report = await prisma.report.findUnique({
      where: { bookingId },
      include: {
        booking: {
          select: {
            slot: {
              select: {
                counselorId: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (
      (role === 'STUDENT' && report.studentId !== userId) ||
      (role === 'COUNSELOR' &&
        report.booking.slot.counselorId !== await getCounselorProfileIdForUser(prisma, userId)) ||
      !['STUDENT', 'COUNSELOR', 'ADMIN'].includes(role)
    ) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (role === 'STUDENT' && report.approvalStatus !== 'APPROVED') {
      return res.status(404).json({ error: 'Report is not available yet' });
    }

    const { booking: _booking, ...reportDetails } = report;
    res.json(reportDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// GET: Get all reports for a student
router.get('/student/my-reports', authMiddleware, async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.userId;
    const role = (req as any).user.role;

    if (role !== 'STUDENT') {
      return res.status(403).json({ error: 'Students only' });
    }

    const reports = await prisma.report.findMany({
      where: { studentId, approvalStatus: 'APPROVED' },
      include: {
        booking: {
          select: {
            id: true,
            slot: {
              select: {
                counselorId: true,
                date: true,
                startTime: true,
                endTime: true,
                counselor: { select: { name: true, specialization: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.patch('/:reportId/review', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, role } = (req as any).user;
    if (role !== 'ADMIN' && role !== 'COUNSELOR') {
      return res.status(403).json({ error: 'Counselor or admin access required' });
    }
    const { status, reviewNote } = req.body;
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return res.status(400).json({ error: 'Review status must be APPROVED or REJECTED' });
    }
    if (status === 'REJECTED' && (typeof reviewNote !== 'string' || !reviewNote.trim())) {
      return res.status(400).json({ error: 'A review note is required when requesting changes' });
    }
    if (reviewNote !== undefined && (typeof reviewNote !== 'string' || reviewNote.length > 2000)) {
      return res.status(400).json({ error: 'Review note must be 2,000 characters or fewer' });
    }

    const report = await prisma.report.findUnique({
      where: { id: req.params.reportId },
      include: {
        booking: {
          select: {
            id: true,
            student: { select: { id: true, name: true, email: true } },
            slot: {
              select: {
                counselorId: true,
                date: true,
                startTime: true,
                endTime: true,
                counselor: { select: { name: true, specialization: true } },
              },
            },
          },
        },
      },
    });
    if (!report) return res.status(404).json({ error: 'Report not found' });

    if (role === 'COUNSELOR') {
      const counselorId = await getCounselorProfileIdForUser(prisma, userId);
      if (!counselorId || report.booking.slot.counselorId !== counselorId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      if (status !== 'APPROVED' || report.approvalStatus !== 'COUNSELOR_REVIEW') {
        return res.status(409).json({ error: 'Only reports awaiting counselor approval can be approved' });
      }
      const reviewed = await prisma.report.update({
        where: { id: report.id },
        data: {
          approvalStatus: 'PENDING_REVIEW',
          counselorReviewedAt: new Date(),
          counselorReviewedById: userId,
          reviewedAt: null,
          reviewedById: null,
          reviewNote: null,
        },
      });
      return res.json(reviewed);
    }

    if (status === 'REJECTED') {
      if (report.approvalStatus !== 'PENDING_REVIEW') {
        return res.status(409).json({ error: 'Only reports awaiting review can be rejected' });
      }
      const updated = await prisma.report.update({
        where: { id: report.id },
        data: {
          approvalStatus: 'REJECTED',
          reviewedAt: new Date(),
          reviewedById: (req as any).user.userId,
          reviewNote: typeof reviewNote === 'string' ? reviewNote.trim() : null,
        },
      });
      return res.json(updated);
    }

    if (report.approvalStatus !== 'PENDING_REVIEW' && report.approvalStatus !== 'APPROVED') {
      return res.status(409).json({ error: 'Only reports awaiting review can be approved' });
    }
    const approved = report.approvalStatus === 'APPROVED'
      ? report
      : await prisma.report.update({
          where: { id: report.id },
          data: {
            approvalStatus: 'APPROVED',
            reviewedAt: new Date(),
            reviewedById: (req as any).user.userId,
            reviewNote: typeof reviewNote === 'string' ? reviewNote.trim() : null,
          },
          include: {
            booking: {
              select: {
                student: { select: { id: true, name: true, email: true } },
                slot: {
                  select: {
                    date: true,
                    startTime: true,
                    endTime: true,
                    counselor: { select: { name: true, specialization: true } },
                  },
                },
              },
            },
          },
        });

    if (!approved.emailSentAt) {
      try {
        await sendEmail({
          to: approved.booking.student.email,
          ...reportApprovedEmail(
            approved.booking.student.name,
            approved.booking.slot.counselor.name,
            approved.booking.slot.counselor.specialization,
            `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking/${approved.bookingId}/report`
          ),
        });
        const emailed = await prisma.report.update({
          where: { id: approved.id },
          data: { emailSentAt: new Date() },
        });
        return res.json(emailed);
      } catch (emailError) {
        console.error('Approved report email delivery failed:', emailError);
        return res.status(502).json({
          error: 'Report approved, but email delivery failed. Approve again to retry delivery.',
        });
      }
    }
    return res.json(approved);
  } catch (error) {
    console.error('Report review failed:', error);
    res.status(500).json({ error: 'Failed to review report' });
  }
});

// GET: Get all reports written by a counselor
router.get('/counselor/my-reports', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;

    if (role !== 'COUNSELOR' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Counselor access required' });
    }

    const counselorId =
      role === 'COUNSELOR' ? await getCounselorProfileIdForUser(prisma, userId) : null;
    if (role === 'COUNSELOR' && !counselorId) {
      return res.status(403).json({ error: 'No counselor profile is linked to this account' });
    }
    const whereClause =
      role === 'ADMIN'
        ? {}
        : {
            booking: {
              slot: {
                counselorId: counselorId!,
              },
            },
          };

    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        booking: {
          select: {
            id: true,
            student: { select: { id: true, name: true, email: true } },
            slot: {
              select: {
                date: true,
                startTime: true,
                endTime: true,
                counselor: { select: { name: true, specialization: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET: Get all reports (admin only)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const role = (req as any).user.role;

    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const reports = await prisma.report.findMany({
      include: {
        booking: {
          select: {
            id: true,
            student: { select: { id: true, name: true, email: true } },
            sessionChecklistAnswers: true,
            slot: {
              select: {
                date: true,
                startTime: true,
                endTime: true,
                counselor: { select: { name: true, specialization: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE REPORT
// ═══════════════════════════════════════════════════════════════════════════════

router.delete('/:reportId', authMiddleware, counselorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const userId = (req as any).user.userId;
    const role = (req as any).user.role;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { booking: { include: { slot: true } } },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const counselorId =
      role === 'COUNSELOR' ? await getCounselorProfileIdForUser(prisma, userId) : null;
    if (role === 'COUNSELOR' && (!counselorId || report.booking.slot.counselorId !== counselorId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.report.delete({
      where: { id: reportId },
    });

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
