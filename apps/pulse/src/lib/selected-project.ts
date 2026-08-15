import { SELECTED_PROJECT_STORAGE_KEY } from '@/lib/timesheet';
import type { JiraProject } from '@/types/timesheet';

/**
 * Backing store for the app-wide project scope.
 *
 * Mirrors the `useTimesheetSettings` pattern: a module-level cached snapshot
 * read through `useSyncExternalStore`, with a hand-dispatched `storage` event
 * so the writing tab notifies its own readers (the native event does not fire
 * in the tab that performed the write).
 *
 * The whole `JiraProject` object is persisted rather than a bare id, because
 * downstream callers need three different shapes: the id as a string, the id
 * coerced to a number, and the key.
 */

// Cached snapshot — useSyncExternalStore requires getSnapshot to return the
// same reference when data hasn't changed, otherwise React infinite-loops.
let cachedSnapshot: JiraProject | null = null;

function isJiraProject(value: unknown): value is JiraProject {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.key === 'string' &&
    typeof candidate.name === 'string'
  );
}

export function getStoredProject(): JiraProject | null {
  try {
    const stored = localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    const next = isJiraProject(parsed) ? parsed : null;

    // Only create a new reference when the serialized value actually changes
    if (JSON.stringify(next) !== JSON.stringify(cachedSnapshot)) {
      cachedSnapshot = next;
    }
  } catch {
    // Ignore parse errors, keep last cached value
  }
  return cachedSnapshot;
}

/** Stable server/hydration snapshot — nothing is selected until localStorage is read. */
export function getServerProject(): JiraProject | null {
  return null;
}

export function subscribeToStoredProject(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function writeStoredProject(project: JiraProject | null) {
  if (project) {
    localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, JSON.stringify(project));
  } else {
    localStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY);
  }
  window.dispatchEvent(new Event('storage'));
}
