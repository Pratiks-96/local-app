import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/conversations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: req.user!.userId },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    res.json(memberships.map((m) => m.conversation));
  } catch (err) {
    next(err);
  }
});

router.post('/conversations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { participantId, isGroup, name, memberIds } = req.body;

    if (!isGroup && participantId) {
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId: req.user!.userId } } },
            { members: { some: { userId: participantId } } },
          ],
        },
        include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } } },
      });
      if (existing) {
        res.json(existing);
        return;
      }

      const conversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          members: {
            create: [
              { userId: req.user!.userId },
              { userId: participantId },
            ],
          },
        },
        include: {
          members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
        },
      });
      res.status(201).json(conversation);
      return;
    }

    const ids = [req.user!.userId, ...(memberIds || [])];
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: true,
        name,
        members: { create: ids.map((userId: string) => ({ userId })) },
      },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
      },
    });
    res.status(201).json(conversation);
  } catch (err) {
    next(err);
  }
});

router.get('/conversations/:id/messages', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: req.params.id,
          userId: req.user!.userId,
        },
      },
    });
    if (!member) throw new AppError(403, 'Not a member of this conversation');

    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);

    const messages = await prisma.message.findMany({
      where: {
        conversationId: req.params.id,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    res.json(messages.reverse());
  } catch (err) {
    next(err);
  }
});

router.post('/conversations/:id/messages', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { content, mediaUrl } = req.body;
    if (!content?.trim()) throw new AppError(400, 'Message content required');

    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: req.params.id,
          userId: req.user!.userId,
        },
      },
    });
    if (!member) throw new AppError(403, 'Not a member');

    const message = await prisma.message.create({
      data: {
        conversationId: req.params.id,
        senderId: req.user!.userId,
        content: content.trim(),
        mediaUrl,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    await prisma.conversation.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

export default router;
