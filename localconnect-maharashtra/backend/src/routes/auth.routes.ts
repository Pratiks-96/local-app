import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 */
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, phone, password, firstName, lastName, locationId } = req.body;

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new AppError(409, 'Email already registered');
    }
    if (phone) {
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) throw new AppError(409, 'Phone already registered');
    }

    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location) throw new AppError(400, 'Invalid location');

    const passwordHash = await bcrypt.hash(password, 12);
    const emailVerifyToken = uuidv4();

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        firstName,
        lastName,
        locationId,
        emailVerifyToken: email ? emailVerifyToken : undefined,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        locationId: true,
      },
    });

    const tokens = {
      accessToken: signAccessToken({ userId: user.id, email: user.email || undefined, role: user.role }),
      refreshToken: signRefreshToken({ userId: user.id, email: user.email || undefined, role: user.role }),
    };

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    res.status(201).json({ user, ...tokens });
  } catch (err) {
    next(err);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    const user = await prisma.user.findFirst({
      where: email ? { email } : { phone },
    });

    if (!user || !user.passwordHash) {
      throw new AppError(401, 'Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(401, 'Invalid credentials');
    if (!user.isActive) throw new AppError(403, 'Account deactivated');

    const payload = { userId: user.id, email: user.email || undefined, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        locationId: user.locationId,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError(401, 'Invalid refresh token');
    }

    const newPayload = { userId: user.id, email: user.email || undefined, role: user.role };
    const accessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const resetToken = uuidv4();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry: new Date(Date.now() + 3600000),
        },
      });
      // In production: send email with reset link
    }
    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });
    if (!user) throw new AppError(400, 'Invalid or expired reset token');

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        emailVerified: true,
        locationId: true,
        location: {
          include: {
            parent: { include: { parent: { include: { parent: true } } } },
          },
        },
        createdAt: true,
      },
    });
    if (!user) throw new AppError(404, 'User not found');
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { refreshToken: null },
    });
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});

router.get('/verify-email/:token', async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: req.params.token },
    });
    if (!user) throw new AppError(400, 'Invalid verification token');

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null },
    });

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
