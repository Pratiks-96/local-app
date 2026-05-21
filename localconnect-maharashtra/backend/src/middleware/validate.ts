import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten(),
      });
      return;
    }
    const { body, query, params } = result.data as {
      body?: unknown;
      query?: unknown;
      params?: unknown;
    };
    if (body !== undefined) req.body = body;
    if (query !== undefined) Object.assign(req.query, query);
    if (params !== undefined) Object.assign(req.params, params);
    next();
  };
}
