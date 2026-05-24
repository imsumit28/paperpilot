import type { Server as HttpServer } from 'node:http';
import { Server as IOServer, type Socket } from 'socket.io';
import { SOCKET_EVENTS, type SubscribePayload } from '@paper-pilot/shared';
import { env } from '../config/env';
import { logger } from '../config/logger';

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

    socket.on(SOCKET_EVENTS.SUBSCRIBE_JOB, (payload: SubscribePayload, ack?: (ok: boolean) => void) => {
      if (!payload?.assignmentId) {
        ack?.(false);
        return;
      }
      const room = roomFor(payload.assignmentId);
      socket.join(room);
      logger.debug({ id: socket.id, room }, 'socket joined room');
      ack?.(true);
    });

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
