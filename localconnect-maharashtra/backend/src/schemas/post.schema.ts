import { z } from 'zod';

const categories = ['GENERAL', 'BUY_SELL', 'LOST_FOUND', 'EVENTS', 'ALERTS', 'JOBS', 'RECOMMENDATIONS'] as const;

export const createPostSchema = z.object({
  body: z.object({
    title: z.string().max(200).optional(),
    content: z.string().min(1).max(10000),
    category: z.enum(categories).default('GENERAL'),
    mediaUrls: z.array(z.string().url()).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    poll: z.object({
      question: z.string().min(1).max(300),
      options: z.array(z.string().min(1).max(100)).min(2).max(6),
      endsAt: z.string().datetime().optional(),
    }).optional(),
  }),
});

export const feedQuerySchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
    category: z.enum(categories).optional(),
  }),
});

export const commentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(2000),
    parentId: z.string().uuid().optional(),
  }),
});
