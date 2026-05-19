import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getNearbyLocationIds } from '../services/location.service';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const q = (req.query.q as string) || '';
    const type = (req.query.type as string) || 'all';

    if (q.length < 2) {
      res.json({ posts: [], users: [], locations: [], marketplace: [] });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    const locationIds = user?.locationId ? await getNearbyLocationIds(user.locationId) : [];

    const results: Record<string, unknown> = {};

    if (type === 'all' || type === 'posts') {
      results.posts = await prisma.post.findMany({
        where: {
          status: 'ACTIVE',
          locationId: locationIds.length ? { in: locationIds } : undefined,
          OR: [
            { content: { contains: q, mode: 'insensitive' } },
            { title: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      });
    }

    if (type === 'all' || type === 'users') {
      results.users = await prisma.user.findMany({
        where: {
          isActive: true,
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      });
    }

    if (type === 'all' || type === 'locations') {
      results.locations = await prisma.location.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        take: 10,
        include: {
          parent: { include: { parent: { include: { parent: true } } } },
        },
      });
    }

    if (type === 'all' || type === 'marketplace') {
      results.marketplace = await prisma.marketplaceItem.findMany({
        where: {
          isSold: false,
          ...(locationIds.length ? { locationId: { in: locationIds } } : {}),
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
      });
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;
