'use client';

import { useEffect, useRef } from 'react';
import { listAssignments } from '@/lib/api';
import { useNotificationsStore } from '@/store/useNotificationsStore';

const POLL_INTERVAL_MS = 8000;

export function NotificationsProvider() {
  const lastSeenRef = useRef<Map<string, string> | null>(null);
  const initializedRef = useRef(false);
  const addCompletion = useNotificationsStore((s) => s.addCompletion);
  const addFailure = useNotificationsStore((s) => s.addFailure);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const data = await listAssignments(1, 20);
        if (cancelled) return;
        const prev = lastSeenRef.current;
        const next = new Map<string, string>();
        for (const a of data.items) {
          next.set(a.id, a.status);
        }
        if (prev) {
          for (const a of data.items) {
            const before = prev.get(a.id);
            if (!before) continue;
            if (before === a.status) continue;
            if (a.status === 'completed' && before !== 'completed') {
              addCompletion({ assignmentId: a.id, title: a.title });
            } else if (a.status === 'failed' && before !== 'failed') {
              addFailure({ assignmentId: a.id, title: a.title });
            }
          }
        }
        lastSeenRef.current = next;
        initializedRef.current = true;
      } catch {
        /* swallow — background poll, retry next tick */
      }
    }

    tick();
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [addCompletion, addFailure]);

  return null;
}
