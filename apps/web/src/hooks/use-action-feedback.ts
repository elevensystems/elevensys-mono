import { useCallback, useEffect, useRef, useState } from 'react';

import { ACTION_FEEDBACK_DURATION } from '@/lib/constants';

type FeedbackState = {
  type: 'success' | 'error';
  key: number;
};

export function useActionFeedback() {
  const [states, setStates] = useState<Map<string, FeedbackState>>(new Map());
  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const trigger = useCallback((id: string, options?: { error?: boolean }) => {
    const existing = timeouts.current.get(id);
    if (existing) clearTimeout(existing);

    setStates(prev => {
      const next = new Map(prev);
      next.set(id, {
        type: options?.error ? 'error' : 'success',
        key: Date.now(),
      });
      return next;
    });

    const timeout = setTimeout(() => {
      setStates(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      timeouts.current.delete(id);
    }, ACTION_FEEDBACK_DURATION);

    timeouts.current.set(id, timeout);
  }, []);

  const isActive = useCallback((id: string) => states.has(id), [states]);

  const getState = useCallback(
    (id: string) => states.get(id) ?? null,
    [states]
  );

  useEffect(() => {
    const refs = timeouts.current;
    return () => {
      refs.forEach(t => clearTimeout(t));
    };
  }, []);

  return { isActive, getState, trigger };
}
