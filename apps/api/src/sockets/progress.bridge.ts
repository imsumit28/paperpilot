import type { Server as IOServer } from 'socket.io';
import {
  REDIS_CHANNELS,
  SOCKET_EVENTS,
  type JobProgressPayload,
  type JobCompletePayload,
  type JobFailedPayload,
} from '@paper-pilot/shared';
import { redisSub } from '../config/redis';
import { logger } from '../config/logger';
import { roomFor } from './index';

type AnyPayload =
  | ({ kind: 'progress' } & JobProgressPayload)
  | ({ kind: 'complete' } & JobCompletePayload)
  | ({ kind: 'failed' } & JobFailedPayload);

export function startProgressBridge(io: IOServer): void {
  redisSub.psubscribe(REDIS_CHANNELS.jobProgressPattern, (err, count) => {
    if (err) {
      logger.error({ err }, 'Failed to psubscribe to job progress channels');
      return;
    }
    logger.info({ count }, 'Progress bridge subscribed');
  });

  redisSub.on('pmessage', (_pattern, channel, raw) => {
    try {
      const payload = JSON.parse(raw) as AnyPayload;
      const room = roomFor(payload.assignmentId);

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
      }
    } catch (err) {
      logger.error({ err, channel, raw }, 'Failed to forward progress message');
    }
  });
}

function stripKind<T extends { kind: string }>(p: T): Omit<T, 'kind'> {
  const { kind: _kind, ...rest } = p;
  return rest;
}
