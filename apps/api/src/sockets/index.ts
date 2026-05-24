import type { Server as HttpServer } from 'node:http';
import { Server as IOServer, type Socket } from 'socket.io';
import { SOCKET_EVENTS, type SubscribePayload } from '@paper-pilot/shared';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AssignmentModel } from '../models/Assignment.model';

let io: IOServer | null = null;

export function getIO(): IOServer {
  if (!io) throw new Error('Socket.IO not initialised. Call initSockets(httpServer) first.');
  return io;
}

export function initSockets(httpServer: HttpServer): IOServer {
  io = new IOServer(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
    path: '/socket.io',
    pingInterval: 25_000,
    pingTimeout: 60_000,
  });

  io.on('connection', (socket: Socket) => {
    logger.debug({ id: socket.id }, 'socket connected');

    socket.on(
      SOCKET_EVENTS.SUBSCRIBE_JOB,
      async (payload: SubscribePayload, ack?: (ok: boolean) => void) => {
        if (!payload?.assignmentId) {
          ack?.(false);
          return;
        }
        const room = roomFor(payload.assignmentId);
        socket.join(room);
        logger.debug({ id: socket.id, room }, 'socket joined room');
        ack?.(true);

        // Catch-up: if the job already completed before the client joined the
        // room, the original emit was dropped. Replay current state from Mongo
        // so the UI doesn't get stuck.
        try {
          const doc = await AssignmentModel.findById(payload.assignmentId).lean();
          if (!doc) return;
          if (doc.status === 'completed' && doc.paper) {
            socket.emit(SOCKET_EVENTS.JOB_COMPLETE, {
              assignmentId: String(doc._id),
              jobId: doc.jobId ?? '',
              paper: doc.paper,
              at: Date.now(),
            });
          } else if (doc.status === 'failed') {
            socket.emit(SOCKET_EVENTS.JOB_FAILED, {
              assignmentId: String(doc._id),
              jobId: doc.jobId ?? '',
              code: doc.error?.code ?? 'UNKNOWN',
              message: doc.error?.message ?? 'Generation failed',
              at: Date.now(),
            });
          }
        } catch (err) {
          logger.warn({ err, assignmentId: payload.assignmentId }, 'Subscribe catch-up failed');
        }
      },
    );

    socket.on(SOCKET_EVENTS.UNSUBSCRIBE_JOB, (payload: SubscribePayload) => {
      if (!payload?.assignmentId) return;
      socket.leave(roomFor(payload.assignmentId));
    });

    socket.on('disconnect', (reason) => {
      logger.debug({ id: socket.id, reason }, 'socket disconnected');
    });
  });

  return io;
}

export function roomFor(assignmentId: string): string {
  return `assignment:${assignmentId}`;
}
