import { Router } from 'express';
import { PostCategory, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPostSchema, feedQuerySchema, commentSchema } from '../schemas/post.schema';
import { getNearbyLocationIds } from '../services/location.service';
import { AppError } from '../middleware/errorHandler';
import { cacheDel } from '../lib/redis';

const router = Router();

router.get('/feed', authenticate, validate(feedQuerySchema), async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.locationId) throw new AppError(400, 'Please set your location');

    const locationIds = await getNearbyLocationIds(user.locationId);
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 50);
    const category = req.query.category as PostCategory | undefined;

    const posts = await prisma.post.findMany({
      where: {
        locationId: { in: locationIds },
        status: 'ACTIVE',
        ...(category ? { category } : {}),
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      take: limit + 1,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        location: true,
        poll: { include: { options: { include: { _count: { select: { votes: true } } } } } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: req.user!.userId }, select: { id: true } },
        bookmarks: { where: { userId: req.user!.userId }, select: { id: true } },
      },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    res.json({
      posts: items.map((p) => ({
        ...p,
        liked: p.likes.length > 0,
        bookmarked: p.bookmarks.length > 0,
        likes: undefined,
        bookmarks: undefined,
      })),
      nextCursor,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, validate(createPostSchema), async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.locationId) throw new AppError(400, 'Please set your location');

    const { title, content, category, mediaUrls, tags, poll } = req.body;

    const post = await prisma.post.create({
      data: {
        title,
        content,
        category,
        mediaUrls: mediaUrls || [],
        tags: tags || [],
        authorId: user.id,
        locationId: user.locationId,
        ...(poll
          ? {
              poll: {
                create: {
                  question: poll.question,
                  endsAt: poll.endsAt ? new Date(poll.endsAt) : undefined,
                  options: { create: poll.options.map((text: string) => ({ text })) },
                },
              },
            }
          : {}),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        poll: { include: { options: true } },
      },
    });

    await cacheDel('feed:*');
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        location: true,
        poll: { include: { options: { include: { _count: { select: { votes: true } } } } } },
        comments: {
          where: { parentId: null },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            replies: {
              include: {
                author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { likes: true } },
      },
    });
    if (!post) throw new AppError(404, 'Post not found');
    res.json(post);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/like', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId: req.params.id, userId: req.user!.userId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      res.json({ liked: false });
    } else {
      await prisma.like.create({
        data: { postId: req.params.id, userId: req.user!.userId },
      });
      const post = await prisma.post.findUnique({ where: { id: req.params.id } });
      if (post && post.authorId !== req.user!.userId) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: 'LIKE',
            title: 'New like',
            body: 'Someone liked your post',
            link: `/posts/${post.id}`,
          },
        });
      }
      res.json({ liked: true });
    }
  } catch (err) {
    next(err);
  }
});

router.post('/:id/bookmark', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.bookmark.findUnique({
      where: { postId_userId: { postId: req.params.id, userId: req.user!.userId } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      res.json({ bookmarked: false });
    } else {
      await prisma.bookmark.create({
        data: { postId: req.params.id, userId: req.user!.userId },
      });
      res.json({ bookmarked: true });
    }
  } catch (err) {
    next(err);
  }
});

router.post('/:id/comments', authenticate, validate(commentSchema), async (req: AuthRequest, res, next) => {
  try {
    const { content, parentId } = req.body;
    const comment = await prisma.comment.create({
      data: {
        content,
        postId: req.params.id,
        authorId: req.user!.userId,
        parentId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (post && post.authorId !== req.user!.userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'COMMENT',
          title: 'New comment',
          body: content.slice(0, 100),
          link: `/posts/${post.id}`,
        },
      });
    }

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/report', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) throw new AppError(400, 'Reason is required');

    const report = await prisma.report.create({
      data: {
        reason,
        reporterId: req.user!.userId,
        postId: req.params.id,
      },
    });
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/pin', authenticate, authorize(Role.MODERATOR, Role.ADMIN), async (req, res, next) => {
  try {
    const post = await prisma.post.update({
      where: { id: req.params.id },
      data: { isPinned: req.body.isPinned ?? true },
    });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

export default router;
