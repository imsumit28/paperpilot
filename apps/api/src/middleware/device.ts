import type { Request, Response, NextFunction } from 'express';
import { badRequest } from './errorHandler';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Owner id for the calling device, populated by `requireDevice`. */
      deviceId?: string;
    }
  }
}

const HEADER = 'x-device-id';
const MAX_LEN = 128;

/**
 * Resolves the calling device's id from the `X-Device-Id` header (used by all
 * JSON/XHR requests) or a `deviceId` query param (used by plain GET downloads
 * like the PDF link, which can't set headers). Rejects requests without one so
 * unscoped queries can never run.
 */
export function requireDevice(req: Request, _res: Response, next: NextFunction): void {
  const fromHeader = req.header(HEADER);
  const fromQuery = typeof req.query.deviceId === 'string' ? req.query.deviceId : undefined;
  const raw = (fromHeader ?? fromQuery ?? '').trim();

  if (!raw) {
    next(badRequest('Missing device identifier'));
    return;
  }
  if (raw.length > MAX_LEN) {
    next(badRequest('Invalid device identifier'));
    return;
  }

  req.deviceId = raw;
  next();
}
