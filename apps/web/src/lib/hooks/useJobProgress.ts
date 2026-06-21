'use client';

import { useEffect } from 'react';
import {
  SOCKET_EVENTS,
  type JobCompletePayload,
  type JobFailedPayload,
  type JobProgressPayload,
} from '@paper-pilot/shared';
import { getSocket } from '../socket';
import { emitJobSubscription, subscribeToJob, unsubscribeFromJob } from '../jobSubscriptions';
import { useGenerationStore } from '@/store/useGenerationStore';

export function useJobProgress(assignmentId: string | null) {
  const applyProgress = useGenerationStore((s) => s.applyProgress);
  const applyComplete = useGenerationStore((s) => s.applyComplete);
  const applyFailed = useGenerationStore((s) => s.applyFailed);

  useEffect(() => {
    if (!assignmentId) return;
    const socket = getSocket();

    // Re-emit SUBSCRIBE_JOB on every (re)connect. Server-side room membership
    // is lost when the socket disconnects (e.g., API restart, network blip),
    // so we must rejoin or progress events will silently drop.
    const rejoin = () => emitJobSubscription(assignmentId);

    const onProgress = (p: JobProgressPayload) => {
      if (p.assignmentId === assignmentId) applyProgress(p);
    };
    const onComplete = (p: JobCompletePayload) => {
      if (p.assignmentId === assignmentId) applyComplete(p);
    };
    const onFailed = (p: JobFailedPayload) => {
      if (p.assignmentId === assignmentId) applyFailed(p);
    };

    socket.on(SOCKET_EVENTS.JOB_PROGRESS, onProgress);
    socket.on(SOCKET_EVENTS.JOB_COMPLETE, onComplete);
    socket.on(SOCKET_EVENTS.JOB_FAILED, onFailed);
    socket.on('connect', rejoin);
    subscribeToJob(assignmentId);

    return () => {
      unsubscribeFromJob(assignmentId);
      socket.off('connect', rejoin);
      socket.off(SOCKET_EVENTS.JOB_PROGRESS, onProgress);
      socket.off(SOCKET_EVENTS.JOB_COMPLETE, onComplete);
      socket.off(SOCKET_EVENTS.JOB_FAILED, onFailed);
    };
  }, [assignmentId, applyProgress, applyComplete, applyFailed]);
}
