import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/search', authenticate, async (req, res, next) => {
  try {
    const q = (req.query.q as string) || '';
    if (q.length < 2) {
      res.json([]);
      return;
    }
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 20,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        location: true,
      },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        bio: true,
        location: {
          include: { parent: { include: { parent: true } } },
        },
        createdAt: true,
        _count: { select: { posts: true } },
      },
    });
    if (!user) throw new AppError(404, 'User not found');
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.patch('/profile', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { firstName, lastName, bio, avatarUrl, locationId } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(locationId && { locationId }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        bio: true,
        locationId: true,
      },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
