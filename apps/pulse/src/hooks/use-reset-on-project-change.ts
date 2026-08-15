'use client';

import { useEffect, useRef } from 'react';

/**
 * Clears a page's search results when the app-wide project scope changes.
 *
 * Searches here are explicit (button-triggered) and each hook snapshots its
 * filters into a ref, so a scope change would otherwise leave the previous
 * project's rows on screen. Resetting — rather than auto-searching — keeps the
 * page honest without firing an unrequested Jira call on every switch.
 */
export function useResetOnProjectChange(
  projectId: string | null,
  reset: () => void
) {
  const previousProjectIdRef = useRef(projectId);

  // `reset` is a fresh closure each render, so this effect re-runs often — the
  // ref guard makes every run but an actual project change a no-op.
  useEffect(() => {
    if (previousProjectIdRef.current === projectId) return;
    previousProjectIdRef.current = projectId;
    reset();
  }, [projectId, reset]);
}
