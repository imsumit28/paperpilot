import type { RequestHandler } from 'express';
import { type ZodSchema } from 'zod';

export const validateBody =
  <T>(schema: ZodSchema<T>): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }
    req.body = parsed.data;
    next();
  };
