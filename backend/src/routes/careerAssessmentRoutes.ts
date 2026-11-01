import express, { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import authMiddleware from '../middlewares/auth.middleware';
import { sendEmail, studentCareerReportEmail } from '../services/email.service';
import {
  generateStudentCareerReport,
  isStudentCareerReport,
  StudentCareerReportConfigurationError,
  StudentCareerReportInputError,
  StudentCareerAssessmentInput,
  StudentCareerReport,
} from '../services/studentCareerReport.service';

const router = express.Router();
const prisma = new PrismaClient();

const assessmentFields: Array<keyof StudentCareerAssessmentInput> = [
  'studentClass',
  'educationBoard',
  'academicPerformance',
  'strongSubjects',
  'dislikedSubjects',
  'hobbies',
  'strengths',
  'improvementAreas',
  'coursesOfInterest',
  'learningStyle',
  'likes',
  'dislikes',
  'careerGoal',
  'parentsAspiration',
];

const requiredFields: Array<keyof StudentCareerAssessmentInput | 'schoolCollege' | 'phoneNumber'> = [
  'studentClass',
  'educationBoard',
  'academicPerformance',
  'schoolCollege',
  'phoneNumber',
];

interface CareerAssessmentData extends StudentCareerAssessmentInput {
  schoolCollege: string;
  phoneNumber: string;
}

function requireStudent(req: Request, res: Response): string | null {
  if (req.user?.role !== 'STUDENT') {
    res.status(403).json({ error: 'Career assessments are only available to students' });
    return null;
  }
  return req.user.userId;
}

function makeReportLink() {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
  return `${frontendUrl}/my-career-report`;
}

async function emailStudentReport(
  studentId: string,
  studentName: string,
  studentEmail: string,
  report: StudentCareerReport
): Promise<void> {
  await sendEmail({
    to: studentEmail,
    ...studentCareerReportEmail(studentName, report, makeReportLink()),
  });
  await prisma.studentCareerAssessment.update({
    where: { studentId },
    data: { reportEmailSentAt: new Date() },
  });
}

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const studentId = requireStudent(req, res);
  if (!studentId) return;

  try {
    const assessment = await prisma.studentCareerAssessment.findUnique({
      where: { studentId },
    });
    return res.json(assessment);
  } catch (error) {
    console.error('Student career assessment fetch failed:', error);
    return res.status(500).json({ error: 'Could not load your career assessment' });
  }
});

router.post('/me', authMiddleware, async (req: Request, res: Response) => {
  const studentId = requireStudent(req, res);
  if (!studentId) return;

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Assessment answers must be provided as an object' });
  }

  const submitted = req.body as Record<string, unknown>;
  const values: CareerAssessmentData = {
    studentClass: '',
    educationBoard: '',
    academicPerformance: '',
    strongSubjects: '',
    dislikedSubjects: '',
    hobbies: '',
    strengths: '',
    improvementAreas: '',
    coursesOfInterest: '',
    learningStyle: '',
    likes: '',
    dislikes: '',
    careerGoal: '',
    parentsAspiration: '',
    schoolCollege: '',
    phoneNumber: '',
  };
  for (const field of assessmentFields) {
    const value = submitted[field];
    if (value !== undefined && typeof value !== 'string') {
      return res.status(400).json({ error: `Invalid value for ${field}` });
    }
    const text = typeof value === 'string' ? value.trim() : '';
    if (text.length > 2000) {
      return res.status(400).json({ error: `${field} must be 2,000 characters or fewer` });
    }
    values[field] = text;
  }

  for (const field of ['schoolCollege', 'phoneNumber'] as const) {
    const value = submitted[field];
    if (typeof value !== 'string') {
      return res.status(400).json({ error: `Invalid value for ${field}` });
    }
    const text = value.trim();
    if (!text || text.length > 2000) {
      return res.status(400).json({ error: `${field} is required and must be 2,000 characters or fewer` });
    }
    values[field] = text;
  }

  const missingField = requiredFields.find((field) => !values[field]);
  if (missingField) {
    return res.status(400).json({ error: `${missingField} is required` });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: studentId },
      select: { name: true, email: true },
    });
    if (!user) return res.status(404).json({ error: 'Student not found' });

    const existingAssessment = await prisma.studentCareerAssessment.findUnique({
      where: { studentId },
    });
    if (existingAssessment && isStudentCareerReport(existingAssessment.report)) {
      return res.status(200).json({
        assessment: existingAssessment,
        emailSent: Boolean(existingAssessment.reportEmailSentAt),
        alreadyGenerated: true,
      });
    }

    const reportInput: StudentCareerAssessmentInput = {
      studentClass: values.studentClass,
      educationBoard: values.educationBoard,
      academicPerformance: values.academicPerformance,
      strongSubjects: values.strongSubjects,
      dislikedSubjects: values.dislikedSubjects,
      hobbies: values.hobbies,
      strengths: values.strengths,
      improvementAreas: values.improvementAreas,
      coursesOfInterest: values.coursesOfInterest,
      learningStyle: values.learningStyle,
      likes: values.likes,
      dislikes: values.dislikes,
      careerGoal: values.careerGoal,
      parentsAspiration: values.parentsAspiration,
    };
    const report = await generateStudentCareerReport(reportInput);
    const reportJson: Prisma.InputJsonObject = { ...report };
    const assessment = await prisma.studentCareerAssessment.upsert({
      where: { studentId },
      create: {
        studentId,
        ...values,
        report: reportJson,
      },
      update: {
        ...values,
        report: reportJson,
        reportEmailSentAt: null,
      },
    });

    try {
      await emailStudentReport(studentId, user.name, user.email, report);
      return res.status(201).json({ assessment: { ...assessment, reportEmailSentAt: new Date() }, emailSent: true });
    } catch (emailError) {
      console.error(`Student career report email failed for student ${studentId}:`, emailError);
      return res.status(201).json({
        assessment,
        emailSent: false,
        emailError: 'The report is ready, but the email could not be delivered. You can retry from the report page.',
      });
    }
  } catch (error) {
    console.error('Student career report generation failed:', error);
    const message = error instanceof Error ? error.message : 'Could not generate your career report';
    const status =
      error instanceof StudentCareerReportConfigurationError
        ? 503
        : error instanceof StudentCareerReportInputError
          ? 400
          : 502;
    return res.status(status).json({ error: message });
  }
});

router.post('/me/email', authMiddleware, async (req: Request, res: Response) => {
  const studentId = requireStudent(req, res);
  if (!studentId) return;

  try {
    const assessment = await prisma.studentCareerAssessment.findUnique({
      where: { studentId },
      include: { student: { select: { name: true, email: true } } },
    });
    if (!assessment?.report || !isStudentCareerReport(assessment.report)) {
      return res.status(404).json({ error: 'Generate your career report before requesting an email' });
    }

    await emailStudentReport(
      studentId,
      assessment.student.name,
      assessment.student.email,
      assessment.report
    );
    return res.json({ emailSent: true });
  } catch (error) {
    console.error(`Student career report retry email failed for student ${studentId}:`, error);
    return res.status(502).json({ error: 'The report is available on the platform, but its email could not be delivered.' });
  }
});

export default router;
