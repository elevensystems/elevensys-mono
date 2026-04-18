'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { SETTINGS_STORAGE_KEY } from '@/lib/timesheet';
import type { TimesheetSettings } from '@/types/timesheet';

const DEFAULT_SETTINGS: TimesheetSettings = {
  username: '',
  token: '',
  jiraInstance: 'jiradc',
};

// Cached snapshot — useSyncExternalStore requires getSnapshot to return the
// same reference when data hasn't changed, otherwise React infinite-loops.
let cachedSnapshot: TimesheetSettings = DEFAULT_SETTINGS;

function getSnapshot(): TimesheetSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const parsed = stored
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
      : DEFAULT_SETTINGS;

    // Only create a new reference when the serialized value actually changes
    if (JSON.stringify(parsed) !== JSON.stringify(cachedSnapshot)) {
      cachedSnapshot = parsed;
    }
  } catch {
    // Ignore parse errors, keep last cached value
  }
  return cachedSnapshot;
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function useTimesheetSettings() {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => DEFAULT_SETTINGS
  );

  const isLoaded = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const saveSettings = useCallback((newSettings: TimesheetSettings) => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    window.dispatchEvent(new Event('storage'));
  }, []);

  const isConfigured = Boolean(
    settings.username && settings.token && settings.jiraInstance
  );

  return { settings, saveSettings, isConfigured, isLoaded };
}
