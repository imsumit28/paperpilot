'use client';

import { getSocket } from './socket';
import { SOCKET_EVENTS } from '@paper-pilot/shared';

// Ref-count map so multiple components can subscribe to the same job room
// without the first to unsubscribe kicking everyone else out.
const refCounts = new Map<string, number>();

export function subscribeToJob(assignmentId: string): void {
  const n = refCounts.get(assignmentId) ?? 0;
  refCounts.set(assignmentId, n + 1);
  if (n === 0) {
    getSocket().emit(SOCKET_EVENTS.SUBSCRIBE_JOB, { assignmentId });
  }
}

export function unsubscribeFromJob(assignmentId: string): void {
  const n = refCounts.get(assignmentId) ?? 0;
  if (n <= 1) {
    refCounts.delete(assignmentId);
    getSocket().emit(SOCKET_EVENTS.UNSUBSCRIBE_JOB, { assignmentId });
  } else {
    refCounts.set(assignmentId, n - 1);
  }
}
