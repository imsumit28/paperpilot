'use client';

import { useEffect, useRef } from 'react';
import { SOCKET_EVENTS, type JobCompletePayload, type JobFailedPayload } from '@paper-pilot/shared';
import { listAssignments } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { subscribeToJob, unsubscribeFromJob } from '@/lib/jobSubscriptions';
import { useNotificationsStore } from '@/store/useNotificationsStore';
import { useGenerationStore } from '@/store/useGenerationStore';

export function NotificationsProvider() {
  // assignmentId -> title for every in-progress assignment we're watching
  const trackedRef = useRef<Map<string, string>>(new Map());
  const addCompletion = useNotificationsStore((s) => s.addCompletion);
  const addFailure = useNotificationsStore((s) => s.addFailure);
  const activeId = useGenerationStore((s) => s.assignmentId);
  const activeTitle = useGenerationStore((s) => s.title);
  const activeStatus = useGenerationStore((s) => s.status);

  // Track assignments that just started generating (status === 'subscribed' means
  // startGen was just called — the socket room hasn't been joined yet by useJobProgress
  // if the user is navigating, so we maintain our own subscription here).
  useEffect(() => {
    if (!activeId || !activeTitle || activeStatus !== 'subscribed') return;
    if (trackedRef.current.has(activeId)) return;
    trackedRef.current.set(activeId, activeTitle);
    subscribeToJob(activeId);
  }, [activeId, activeTitle, activeStatus]);

  useEffect(() => {
    const socket = getSocket();

    const onComplete = (p: JobCompletePayload) => {
      const title = trackedRef.current.get(p.assignmentId);
      if (title !== undefined) {
        addCompletion({ assignmentId: p.assignmentId, title });
        unsubscribeFromJob(p.assignmentId);
        trackedRef.current.delete(p.assignmentId);
      }
    };

    const onFailed = (p: JobFailedPayload) => {
      const title = trackedRef.current.get(p.assignmentId);
      if (title !== undefined) {
        addFailure({ assignmentId: p.assignmentId, title });
        unsubscribeFromJob(p.assignmentId);
        trackedRef.current.delete(p.assignmentId);
      }
    };

    socket.on(SOCKET_EVENTS.JOB_COMPLETE, onComplete);
    socket.on(SOCKET_EVENTS.JOB_FAILED, onFailed);

    // One-time fetch to discover assignments that were already in-progress
    // when the app loaded (e.g. user refreshed the page mid-generation).
    listAssignments(1, 50)
      .then((data) => {
        for (const a of data.items) {
          if ((a.status === 'pending' || a.status === 'processing') && !trackedRef.current.has(a.id)) {
            trackedRef.current.set(a.id, a.title);
            subscribeToJob(a.id);
          }
        }
      })
      .catch(() => {});

    return () => {
      socket.off(SOCKET_EVENTS.JOB_COMPLETE, onComplete);
      socket.off(SOCKET_EVENTS.JOB_FAILED, onFailed);
      for (const [id] of trackedRef.current) {
        unsubscribeFromJob(id);
      }
      trackedRef.current.clear();
    };
  }, [addCompletion, addFailure]);

  return null;
}
