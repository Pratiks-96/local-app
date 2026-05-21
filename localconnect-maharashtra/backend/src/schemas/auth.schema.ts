import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    phone: z.string().min(10).max(15).optional(),
    password: z.string().min(8).max(100),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    locationId: z.string().uuid(),
  }).refine((d) => d.email || d.phone, { message: 'Email or phone is required' }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(1),
  }),
});

export const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(1) }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().email() }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(8).max(100),
  }),
});
