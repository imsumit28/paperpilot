'use client';

import { useEffect } from 'react';
import {
  SOCKET_EVENTS,
  type JobCompletePayload,
  type JobFailedPayload,
  type JobProgressPayload,
} from '@paper-pilot/shared';
import { getSocket } from '../socket';
import { useGenerationStore } from '@/store/useGenerationStore';

export function useJobProgress(assignmentId: string | null) {
  const applyProgress = useGenerationStore((s) => s.applyProgress);
  const applyComplete = useGenerationStore((s) => s.applyComplete);
  const applyFailed = useGenerationStore((s) => s.applyFailed);

  useEffect(() => {
    if (!assignmentId) return;
    const socket = getSocket();

    const subscribe = () => {
      socket.emit(SOCKET_EVENTS.SUBSCRIBE_JOB, { assignmentId });
    };

    const onProgress = (p: JobProgressPayload) => {
      if (p.assignmentId === assignmentId) applyProgress(p);
    };
    const onComplete = (p: JobCompletePayload) => {
      if (p.assignmentId === assignmentId) applyComplete(p);
    };
    const onFailed = (p: JobFailedPayload) => {
      if (p.assignmentId === assignmentId) applyFailed(p);
    };

    if (socket.connected) subscribe();
    else socket.on('connect', subscribe);

    socket.on(SOCKET_EVENTS.JOB_PROGRESS, onProgress);
    socket.on(SOCKET_EVENTS.JOB_COMPLETE, onComplete);
    socket.on(SOCKET_EVENTS.JOB_FAILED, onFailed);

    return () => {
      socket.emit(SOCKET_EVENTS.UNSUBSCRIBE_JOB, { assignmentId });
      socket.off('connect', subscribe);
      socket.off(SOCKET_EVENTS.JOB_PROGRESS, onProgress);
      socket.off(SOCKET_EVENTS.JOB_COMPLETE, onComplete);
      socket.off(SOCKET_EVENTS.JOB_FAILED, onFailed);
    };
  }, [assignmentId, applyProgress, applyComplete, applyFailed]);
}
