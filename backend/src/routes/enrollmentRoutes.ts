import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middlewares/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// POST: Enroll in a course
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if ((req as any).user.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only student accounts can enrol in student courses' });
    }
    const { courseId } = req.body;
    const studentId = (req as any).user.userId;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
      },
      include: {
        course: true,
      },
    });

    res.status(201).json({
      message: 'Successfully enrolled in course',
      enrollment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

// GET: Get student's enrollments
router.get('/student/my-enrollments', authMiddleware, async (req: Request, res: Response) => {
  try {
    if ((req as any).user.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Student course enrolments are only available to students' });
    }
    const studentId = (req as any).user.userId;

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: true,
      },
      orderBy: { enrolledAt: 'desc' },
    });

    res.json(enrollments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// GET: Get single enrollment
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!['STUDENT', 'ADMIN'].includes((req as any).user.role)) {
      return res.status(403).json({ error: 'Student course enrolments are only available to students' });
    }
    const { id } = req.params;
    const studentId = (req as any).user.userId;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    // Check authorization
    if (enrollment.studentId !== studentId && (req as any).user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(enrollment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch enrollment' });
  }
});

// PUT: Update enrollment progress
router.put('/:id/progress', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!['STUDENT', 'ADMIN'].includes((req as any).user.role)) {
      return res.status(403).json({ error: 'Student course progress is only available to students' });
    }
    const { id } = req.params;
    const { progress } = req.body;
    const studentId = (req as any).user.userId;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be between 0 and 100' });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    if (enrollment.studentId !== studentId && (req as any).user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await prisma.enrollment.update({
      where: { id },
      data: {
        progress,
        completed: progress === 100,
        completedAt: progress === 100 ? new Date() : null,
      },
      include: { course: true },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// DELETE: Unenroll from course
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!['STUDENT', 'ADMIN'].includes((req as any).user.role)) {
      return res.status(403).json({ error: 'Student course enrolments are only available to students' });
    }
    const { id } = req.params;
    const studentId = (req as any).user.userId;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    if (enrollment.studentId !== studentId && (req as any).user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.enrollment.delete({
      where: { id },
    });

    res.json({ message: 'Unenrolled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to unenroll' });
  }
});

// GET: Get all enrollments for a course (admin only)
router.get('/course/:courseId/enrollments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const userRole = (req as any).user.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can view this' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(enrollments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

export default router;
