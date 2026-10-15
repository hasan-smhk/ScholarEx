import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { sendEmail, counselorApplicationReceivedEmail } from '../services/email.service';

const router = express.Router();
const prisma = new PrismaClient();

// POST: Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      role,
      mobileNumber,
      professionalQualifications,
      specialization,
      moreThanOneYear,
      yearsExperience,
      experienceDetails,
      hasCertification,
      certificationDetails,
      enrollInCertificationProgram,
    } = req.body;
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (
      !normalizedName ||
      normalizedName.length > 120 ||
      normalizedEmail.length > 254 ||
      !/^\S+@\S+\.\S+$/.test(normalizedEmail) ||
      typeof password !== 'string' ||
      password.length < 6
    ) {
      return res.status(400).json({ error: 'Enter a valid name, email, and password of at least 6 characters' });
    }

    if (role !== undefined && role !== 'STUDENT' && role !== 'COUNSELOR') {
      return res.status(400).json({ error: 'Registration role must be STUDENT or COUNSELOR' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const accountRole = role === 'COUNSELOR' ? 'COUNSELOR' : 'STUDENT';
    if (accountRole === 'COUNSELOR') {
      const normalizedMobile = typeof mobileNumber === 'string' ? mobileNumber.trim() : '';
      const mobileDigits = normalizedMobile.replace(/\D/g, '');
      const qualifications =
        typeof professionalQualifications === 'string' ? professionalQualifications.trim() : '';
      const normalizedSpecialization =
        typeof specialization === 'string' ? specialization.trim() : '';
      const years = Number(yearsExperience);
      const details = typeof experienceDetails === 'string' ? experienceDetails.trim() : '';
      const certificateDetails =
        typeof certificationDetails === 'string' ? certificationDetails.trim() : '';
      const requiresExperience = process.env.COUNSELOR_REGISTRATION_REQUIRE_EXPERIENCE === 'true';

      if (mobileDigits.length < 10 || mobileDigits.length > 15 || normalizedMobile.length > 32) {
        return res.status(400).json({ error: 'Enter a valid mobile number with 10 to 15 digits' });
      }
      if (qualifications.length < 2 || qualifications.length > 2000) {
        return res.status(400).json({ error: 'Professional qualifications are required (maximum 2000 characters)' });
      }
      if (!normalizedSpecialization || normalizedSpecialization.length > 120) {
        return res.status(400).json({ error: 'Counselling specialization is required (maximum 120 characters)' });
      }
      if (
        typeof moreThanOneYear !== 'boolean' ||
        !Number.isInteger(years) ||
        years < 0 ||
        years > 80 ||
        (moreThanOneYear && (years <= 1 || details.length < 2 || details.length > 2000)) ||
        (!moreThanOneYear && years > 1)
      ) {
        return res.status(400).json({ error: 'Provide valid professional experience details' });
      }
      if (
        typeof hasCertification !== 'boolean' ||
        (hasCertification && (certificateDetails.length < 2 || certificateDetails.length > 2000))
      ) {
        return res.status(400).json({ error: 'Provide certification details or indicate that you are not certified' });
      }
      if (moreThanOneYear === false && typeof enrollInCertificationProgram !== 'boolean') {
        return res.status(400).json({ error: 'Choose whether to enrol in the certification programme or continue without it' });
      }
      if (requiresExperience && !moreThanOneYear) {
        return res.status(403).json({ error: 'Counsellor registration requires more than one year of experience in this environment' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          name: normalizedName,
          email: normalizedEmail,
          password: hashedPassword,
          role: accountRole,
        },
      });

      if (accountRole === 'COUNSELOR') {
        const existingProfiles = await transaction.counselor.findMany({
          where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
          select: { id: true, userId: true },
        });
        if (existingProfiles.length > 0) {
          throw new Error('COUNSELOR_PROFILE_CONFLICT');
        }

        const profileData = {
          userId: createdUser.id,
          name: normalizedName,
          email: normalizedEmail,
          mobileNumber: mobileNumber.trim(),
          professionalQualifications: professionalQualifications.trim(),
          specialization: specialization.trim(),
          certificationDetails: hasCertification ? certificationDetails.trim() : null,
          certificationStatus: hasCertification ? 'PENDING_VERIFICATION' as const : 'NOT_PROVIDED' as const,
          approvalStatus: 'PENDING' as const,
        };
        const counselor = await transaction.counselor.create({ data: profileData });

        await transaction.counselorExperience.create({
          data: {
            counselorId: counselor.id,
            yearsExperience: Number(yearsExperience),
            details: moreThanOneYear ? experienceDetails.trim() : null,
          },
        });

        if (enrollInCertificationProgram === true) {
          await transaction.counselorCertificationEnrollment.create({
            data: { counselorId: counselor.id },
          });
        }
      }

      return {
        user: createdUser,
        counselorId: accountRole === 'COUNSELOR'
          ? (await transaction.counselor.findUnique({ where: { userId: createdUser.id }, select: { id: true } }))?.id
          : null,
      };
    });
    const user = result.user;
    let applicationEmailSent = true;
    if (result.counselorId) {
      try {
        await sendEmail({
          to: normalizedEmail,
          ...counselorApplicationReceivedEmail(normalizedName),
        });
        await prisma.counselor.update({
          where: { id: result.counselorId },
          data: { applicationEmailSentAt: new Date() },
        });
      } catch (emailError) {
        applicationEmailSent = false;
        console.error('Counselor application confirmation email failed:', emailError);
      }
    }

    const token = jwt.sign(
      { userId: user.id, id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: applicationEmailSent
        ? 'User registered successfully'
        : 'Account created, but the application confirmation email could not be sent. An administrator can retry it.',
      applicationEmailSent,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasUsedFreeSession: user.hasUsedFreeSession,
        marksPercentage: user.marksPercentage,
      },
      token,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    if (error.message === 'COUNSELOR_PROFILE_CONFLICT') {
      return res.status(409).json({ error: 'A counselor profile already exists for this email. Contact support to link the account.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST: Admin login. Admin accounts are provisioned outside public registration.
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!configuredAdminEmail || normalizedEmail !== configuredAdminEmail) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const user = await prisma.user.findUnique({ where: { email: configuredAdminEmail } });
    if (!user || user.role !== 'ADMIN') {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Admin login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasUsedFreeSession: user.hasUsedFreeSession,
        marksPercentage: user.marksPercentage,
      },
      token,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Admin login failed' });
  }
});

// POST: Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });
    if (!user || user.role === 'ADMIN') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.role === 'COUNSELOR') {
      const counselor = await prisma.counselor.findUnique({
        where: { userId: user.id },
        select: { approvalStatus: true },
      });
      if (counselor?.approvalStatus === 'PENDING') {
        return res.status(403).json({ error: 'Your counselor application is awaiting administrator approval.' });
      }
      if (counselor?.approvalStatus !== 'APPROVED') {
        return res.status(403).json({ error: 'Your counselor application has not been approved. Please contact ScholarEx support.' });
      }
    }

    const token = jwt.sign(
      { userId: user.id, id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasUsedFreeSession: user.hasUsedFreeSession,
        marksPercentage: user.marksPercentage,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
