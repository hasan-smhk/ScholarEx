import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import {
  sendEmail,
  counselorApplicationReceivedEmail,
  passwordResetEmail,
  studentRegistrationConfirmationEmail,
} from '../services/email.service';

const router = express.Router();
const prisma = new PrismaClient();
const passwordResetTokenLifetimeMs = 60 * 60 * 1000;

const hashPasswordResetToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

router.post('/forgot-password', async (req: Request, res: Response) => {
  const normalizedEmail = typeof req.body?.email === 'string'
    ? req.body.email.trim().toLowerCase()
    : '';
  if (!normalizedEmail || normalizedEmail.length > 254 || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        role: { in: ['STUDENT', 'COUNSELOR'] },
      },
      select: { id: true, name: true, email: true },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashPasswordResetToken(resetToken);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: tokenHash,
          passwordResetTokenExpiresAt: new Date(Date.now() + passwordResetTokenLifetimeMs),
        },
      });

      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
      const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
      try {
        await sendEmail({
          to: user.email,
          ...passwordResetEmail(user.name, resetLink),
        });
      } catch (emailError) {
        console.error(`Password reset email delivery failed for user ${user.id}:`, emailError);
        await prisma.user.updateMany({
          where: { id: user.id, passwordResetTokenHash: tokenHash },
          data: { passwordResetTokenHash: null, passwordResetTokenExpiresAt: null },
        });
        return res.status(503).json({ error: 'Password reset email could not be sent. Please try again later.' });
      }
    }

    return res.json({
      message: 'If an account exists for this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Password reset request failed:', error);
    return res.status(500).json({ error: 'Could not process your password reset request' });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body ?? {};
  if (
    typeof token !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(token) ||
    typeof password !== 'string' ||
    password.length < 6 ||
    password.length > 128
  ) {
    return res.status(400).json({ error: 'Provide a valid reset link and a password between 6 and 128 characters' });
  }

  try {
    const tokenHash = hashPasswordResetToken(token);
    const now = new Date();
    const user = await prisma.user.findUnique({
      where: { passwordResetTokenHash: tokenHash },
      select: {
        id: true,
        role: true,
        passwordResetTokenExpiresAt: true,
      },
    });
    if (
      !user ||
      user.role === 'ADMIN' ||
      !user.passwordResetTokenExpiresAt ||
      user.passwordResetTokenExpiresAt <= now
    ) {
      return res.status(400).json({ error: 'This password reset link is invalid or has expired. Request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updated = await prisma.user.updateMany({
      where: {
        id: user.id,
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: { gt: now },
      },
      data: {
        password: hashedPassword,
        passwordResetTokenHash: null,
        passwordResetTokenExpiresAt: null,
      },
    });
    if (updated.count !== 1) {
      return res.status(400).json({ error: 'This password reset link is invalid or has expired. Request a new one.' });
    }

    return res.json({ message: 'Password updated successfully. You can now sign in.' });
  } catch (error) {
    console.error('Password reset failed:', error);
    return res.status(500).json({ error: 'Could not reset your password' });
  }
});

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
    let confirmationEmailSent: boolean | null = null;
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
    } else {
      confirmationEmailSent = false;
      try {
        await sendEmail({
          to: normalizedEmail,
          ...studentRegistrationConfirmationEmail(normalizedName),
        });
        confirmationEmailSent = true;
      } catch (emailError) {
        console.error('Student registration confirmation email failed:', emailError);
      }
    }

    const token = jwt.sign(
      { userId: user.id, id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: result.counselorId
        ? applicationEmailSent
          ? 'Counselor application submitted successfully'
          : 'Application created, but the confirmation email could not be sent. An administrator can retry it.'
        : confirmationEmailSent
          ? 'Student registered successfully. A confirmation email has been sent.'
          : 'Student account created, but the confirmation email could not be sent. You can still sign in.',
      applicationEmailSent,
      confirmationEmailSent,
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
