import { Router } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN, Role.MODERATOR));

router.get('/dashboard', authorize(Role.ADMIN), async (_req, res, next) => {
  try {
    const [users, posts, reports, marketplaceItems] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.marketplaceItem.count({ where: { isSold: false } }),
    ]);

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
    });

    res.json({
      stats: { users, posts, pendingReports: reports, marketplaceItems },
      recentUsers,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/users', authorize(Role.ADMIN), async (req, res, next) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = 20;
    const users = await prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        location: true,
      },
    });
    const total = await prisma.user.count();
    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id', authorize(Role.ADMIN), async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.get('/reports', async (req, res, next) => {
  try {
    const status = (req.query.status as string) || 'PENDING';
    const reports = await prisma.report.findMany({
      where: { status: status as 'PENDING' },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true } },
        post: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

router.patch('/reports/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: { status },
    });

    if (status === 'RESOLVED' && req.body.removePost) {
      const fullReport = await prisma.report.findUnique({ where: { id: req.params.id } });
      if (fullReport?.postId) {
        await prisma.post.update({
          where: { id: fullReport.postId },
          data: { status: 'REMOVED' },
        });
      }
    }

    res.json(report);
  } catch (err) {
    next(err);
  }
});

router.patch('/posts/:id/moderate', async (req, res, next) => {
  try {
    const { status } = req.body;
    const post = await prisma.post.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

export default router;
