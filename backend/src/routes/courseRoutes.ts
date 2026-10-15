import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET: Fetch all courses, optionally filtered by board
router.get('/', async (req: Request, res: Response) => {
  try {
    const { board } = req.query;

    const courses = await prisma.course.findMany({
      where: board ? { board: String(board).toUpperCase() } : {},
      orderBy: { createdAt: 'desc' },
    });

    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET: Fetch single course by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({ where: { id } });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

export default router;
