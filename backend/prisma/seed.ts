import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

declare const process: any;

const prisma: any = new PrismaClient();

async function seedCounselor(data: {
  name: string;
  email: string;
  specialization: string;
  description: string;
}) {
  const existingCounselor = await prisma.counselor.findFirst({
    where: { email: data.email },
  });

  if (existingCounselor) {
    return prisma.counselor.update({
      where: { id: existingCounselor.id },
      data,
    });
  }

  return prisma.counselor.create({ data });
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding the database');
  }

  if (adminPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters');
  }

  const normalizedAdminEmail = adminEmail.toLowerCase();
  const legacyAdmin = await prisma.user.findUnique({ where: { email: 'admin@scholarex.com' } });
  if (legacyAdmin && normalizedAdminEmail !== 'admin@scholarex.com') {
    await prisma.user.update({
      where: { id: legacyAdmin.id },
      data: { email: `disabled-${legacyAdmin.id}@invalid.local` },
    });
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: normalizedAdminEmail },
    update: { password: passwordHash, role: 'ADMIN' },
    create: {
      name: process.env.ADMIN_NAME || 'ScholarEx Administrator',
      email: normalizedAdminEmail,
      password: passwordHash,
      role: 'ADMIN',
    } as any,
  });

  // Sample student
  const studentPassword = await bcrypt.hash('student123', 10);
  await prisma.user.upsert({
    where: { email: 'student@scholarex.com' },
    update: { password: studentPassword },
    create: {
      name: 'Student User',
      email: 'student@scholarex.com',
      password: studentPassword,
      role: 'STUDENT',
    } as any,
  });

  // Sample courses
  const courses = [
    {
      title: 'CBSE Mathematics',
      board: 'CBSE',
      level: 'Class 10',
      instructor: 'Mr. Arun',
      description: 'Foundation mathematics for CBSE Class 10.',
    },
    {
      title: 'ICSE Science',
      board: 'ICSE',
      level: 'Class 9',
      instructor: 'Ms. Priya',
      description: 'Integrated science preparation for ICSE students.',
    },
    {
      title: 'Karnataka State Board English',
      board: 'State Board',
      level: 'Class 8',
      instructor: 'Mrs. Kavya',
      description: 'English language and grammar for Karnataka State Board.',
    },
    {
      title: 'Skill Development - Communication',
      board: 'Skill Development',
      level: 'Beginner',
      instructor: 'Mr. Rahul',
      description: 'Communication and soft skills development.',
    },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { id: `${course.title}-${course.level}`.replace(/\s+/g, '-') },
      update: {},
      create: {
        id: `${course.title}-${course.level}`.replace(/\s+/g, '-'),
        ...course,
      },
    });
  }

  // Counselors
  await seedCounselor({
    name: 'Dr. Meera Sharma',
    email: 'counselor1@scholarex.com',
    specialization: 'Career Guidance',
    description: 'Expert in career planning, stream selection, and higher education guidance.',
  });

  await seedCounselor({
    name: 'Mr. Ajay Verma',
    email: 'counselor2@scholarex.com',
    specialization: 'Skill Development',
    description: 'Specialist in personal growth, employability skills, and certification pathways.',
  });

}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
