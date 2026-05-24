import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  SOCKET_EVENTS,
  type JobProgressPayload,
  type JobCompletePayload,
  type JobFailedPayload,
} from '@paper-pilot/shared';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { getIO, roomFor } from '../sockets';

type AnyPayload =
  | ({ kind: 'progress' } & JobProgressPayload)
  | ({ kind: 'complete' } & JobCompletePayload)
  | ({ kind: 'failed' } & JobFailedPayload);

function requireInternalSecret(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('x-internal-secret');
  if (!header || header !== env.INTERNAL_SECRET) {
    res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'invalid internal secret' } });
    return;
  }
  next();
}

const router = Router();

// Worker -> API progress relay. Replaces the prior Redis pub/sub bridge so
// progress events don't burn per-command Upstash quota.
router.post('/progress', requireInternalSecret, (req: Request, res: Response): void => {
  const payload = req.body as AnyPayload | undefined;
  if (!payload?.assignmentId || !payload.kind) {
    res.status(400).json({ ok: false, error: { code: 'BAD_PAYLOAD', message: 'missing assignmentId or kind' } });
    return;
  }

  const room = roomFor(payload.assignmentId);
  const io = getIO();
  const roomSize = io.sockets.adapter.rooms.get(room)?.size ?? 0;
  logger.info(
    { kind: payload.kind, assignmentId: payload.assignmentId, room, roomSize },
    'Relay: emitting to room',
  );

  switch (payload.kind) {
    case 'progress':
      io.to(room).emit(SOCKET_EVENTS.JOB_PROGRESS, stripKind(payload));
      break;
    case 'complete':
      io.to(room).emit(SOCKET_EVENTS.JOB_COMPLETE, stripKind(payload));
      break;
    case 'failed':
      io.to(room).emit(SOCKET_EVENTS.JOB_FAILED, stripKind(payload));
      break;
    default:
      logger.warn({ payload }, 'Unknown internal progress kind');
      res.status(400).json({ ok: false, error: { code: 'BAD_KIND', message: 'unknown kind' } });
      return;
  }

  res.json({ ok: true });
});

function stripKind<T extends { kind: string }>(p: T): Omit<T, 'kind'> {
  const { kind: _kind, ...rest } = p;
  return rest;
}

export default router;
