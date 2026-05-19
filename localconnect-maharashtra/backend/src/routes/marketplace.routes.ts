import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getNearbyLocationIds } from '../services/location.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    const locationIds = user?.locationId ? await getNearbyLocationIds(user.locationId) : [];

    const items = await prisma.marketplaceItem.findMany({
      where: {
        isSold: false,
        ...(locationIds.length ? { locationId: { in: locationIds } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { title, description, price, condition, photos, contactPhone, contactEmail } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

    const item = await prisma.marketplaceItem.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        condition: condition || 'GOOD',
        photos: photos || [],
        contactPhone,
        contactEmail,
        authorId: req.user!.userId,
        locationId: user?.locationId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const item = await prisma.marketplaceItem.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, phone: true, email: true } },
      },
    });
    if (!item) throw new AppError(404, 'Item not found');
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/sold', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const item = await prisma.marketplaceItem.findUnique({ where: { id: req.params.id } });
    if (!item) throw new AppError(404, 'Item not found');
    if (item.authorId !== req.user!.userId) throw new AppError(403, 'Not authorized');

    const updated = await prisma.marketplaceItem.update({
      where: { id: req.params.id },
      data: { isSold: true },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
