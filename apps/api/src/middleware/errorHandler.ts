import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export class HttpError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly fields?: Record<string, string>;
  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const badRequest = (message: string, fields?: Record<string, string>) =>
  new HttpError(400, 'BAD_REQUEST', message, fields);
export const notFound = (message = 'Not found') => new HttpError(404, 'NOT_FOUND', message);
export const internal = (message = 'Internal server error') =>
  new HttpError(500, 'INTERNAL', message);

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    res
      .status(400)
      .json({ ok: false, error: { code: 'VALIDATION', message: 'Invalid request', fields } });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      ok: false,
      error: { code: err.code, message: err.message, fields: err.fields },
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ ok: false, error: { code: 'INTERNAL', message: 'Internal server error' } });
};
