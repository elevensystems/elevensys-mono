'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DEFAULT_PROFILE_NAME,
  MAX_PROFILE_NAME_LENGTH,
  createWorklogProfile,
  generateEntryId,
  loadWorklogProfiles,
  nextProfileName,
  saveWorklogProfiles,
  worklogProfilesStorageKey,
} from '@/lib/timesheet';
import type { WorkEntry, WorklogProfileStore } from '@/types/timesheet';

export const PROFILE_SAVE_DELAY_MS = 300;

type EntriesUpdater = (prev: WorkEntry[]) => WorkEntry[];

interface PendingSave {
  store: WorklogProfileStore;
  projectId: string;
}

/**
 * Stores read from localStorage rather than produced by an edit. Saving one
 * would only write back what is already there — and after another tab's save,
 * would bounce that tab's change straight back to it.
 */
const loadedStores = new WeakSet<WorklogProfileStore>();

/** `activeId` keeps this tab on the profile it shows, if that still exists. */
function loadStore(
  projectId: string | undefined,
  activeId?: string
): WorklogProfileStore {
  if (!projectId) {
    const profile = createWorklogProfile(DEFAULT_PROFILE_NAME);
    return { activeId: profile.id, profiles: [profile] };
  }
  const loaded = loadWorklogProfiles(projectId);
  const store =
    activeId && loaded.profiles.some(p => p.id === activeId)
      ? { ...loaded, activeId }
      : loaded;
  loadedStores.add(store);
  return store;
}

/**
 * Named sets of work entries per project, so a user can keep several recurring
 * worklog templates and switch between them instead of re-entering rows.
 * Changes are saved to localStorage shortly after they happen, and flushed on
 * project switch, unmount and page hide. Another tab's save reloads the store
 * here, so each tab edits the latest copy instead of overwriting the other's.
 */
export function useWorklogProfiles(projectId: string | undefined) {
  const [storeProjectId, setStoreProjectId] = useState(projectId);
  const [store, setStore] = useState(() => loadStore(projectId));

  if (storeProjectId !== projectId) {
    setStoreProjectId(projectId);
    setStore(loadStore(projectId));
  }

  const pendingSaveRef = useRef<PendingSave | null>(null);
  const flushSave = useCallback(() => {
    const pending = pendingSaveRef.current;
    if (!pending) return;
    pendingSaveRef.current = null;
    saveWorklogProfiles(pending.store, pending.projectId);
  }, []);

  useEffect(() => {
    if (pendingSaveRef.current?.projectId !== storeProjectId) flushSave();
    if (!storeProjectId) return;
    if (loadedStores.has(store)) {
      // Whatever was pending is older than what was just read.
      pendingSaveRef.current = null;
      return;
    }
    pendingSaveRef.current = { store, projectId: storeProjectId };
    const timer = setTimeout(flushSave, PROFILE_SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [store, storeProjectId, flushSave]);

  useEffect(() => {
    if (!storeProjectId) return;
    const key = worklogProfilesStorageKey(storeProjectId);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        setStore(prev => loadStore(storeProjectId, prev.activeId));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storeProjectId]);

  useEffect(() => {
    window.addEventListener('pagehide', flushSave);
    return () => {
      window.removeEventListener('pagehide', flushSave);
      flushSave();
    };
  }, [flushSave]);

  const activeProfile =
    store.profiles.find(p => p.id === store.activeId) ?? store.profiles[0];

  /** Update the active profile's entries. */
  const setEntries = useCallback((updater: EntriesUpdater) => {
    setStore(prev => ({
      ...prev,
      profiles: prev.profiles.map(p =>
        p.id === prev.activeId ? { ...p, entries: updater(p.entries) } : p
      ),
    }));
  }, []);

  const selectProfile = useCallback((id: string) => {
    setStore(prev =>
      prev.profiles.some(p => p.id === id) ? { ...prev, activeId: id } : prev
    );
  }, []);

  /** Adds an empty profile, makes it active and returns its id. */
  const createProfile = useCallback((): string => {
    const id = generateEntryId();
    setStore(prev => ({
      activeId: id,
      profiles: [
        ...prev.profiles,
        { ...createWorklogProfile(nextProfileName(prev.profiles)), id },
      ],
    }));
    return id;
  }, []);

  const duplicateProfile = useCallback((id: string): string => {
    const newId = generateEntryId();
    setStore(prev => {
      const index = prev.profiles.findIndex(p => p.id === id);
      if (index === -1) return prev;
      const source = prev.profiles[index];
      const copy = {
        id: newId,
        name: `${source.name} copy`.slice(0, MAX_PROFILE_NAME_LENGTH),
        entries: source.entries.map(e => ({ ...e, id: generateEntryId() })),
      };
      const profiles = [...prev.profiles];
      profiles.splice(index + 1, 0, copy);
      return { activeId: newId, profiles };
    });
    return newId;
  }, []);

  const renameProfile = useCallback((id: string, name: string) => {
    const trimmed = name.trim().slice(0, MAX_PROFILE_NAME_LENGTH);
    if (!trimmed) return;
    setStore(prev => ({
      ...prev,
      profiles: prev.profiles.map(p =>
        p.id === id ? { ...p, name: trimmed } : p
      ),
    }));
  }, []);

  /** The last remaining profile cannot be deleted. */
  const deleteProfile = useCallback((id: string) => {
    setStore(prev => {
      const index = prev.profiles.findIndex(p => p.id === id);
      if (index === -1 || prev.profiles.length === 1) return prev;
      const profiles = prev.profiles.filter(p => p.id !== id);
      const activeId =
        prev.activeId === id
          ? profiles[Math.min(index, profiles.length - 1)].id
          : prev.activeId;
      return { activeId, profiles };
    });
  }, []);

  return {
    profiles: store.profiles,
    activeProfile,
    entries: activeProfile.entries,
    setEntries,
    selectProfile,
    createProfile,
    duplicateProfile,
    renameProfile,
    deleteProfile,
  };
}
