import { act, renderHook } from '@testing-library/react';

import {
  createDefaultEntry,
  createWorklogProfile,
  loadWorklogProfiles,
  saveWorklogProfiles,
  worklogProfilesStorageKey,
} from '@/lib/timesheet';
import type { WorkEntry } from '@/types/timesheet';

import {
  PROFILE_SAVE_DELAY_MS,
  useWorklogProfiles,
} from './use-worklog-profiles';

const entry = (issueKey: string): WorkEntry => ({
  ...createDefaultEntry(),
  issueKey,
  description: `Work on ${issueKey}`,
});

const savedKeys = (projectId: string) => {
  const store = loadWorklogProfiles(projectId);
  const active = store.profiles.find(p => p.id === store.activeId)!;
  return active.entries.map(e => e.issueKey);
};

function seed(projectId: string, ...profiles: WorkEntry[][]) {
  const created = profiles.map((entries, i) =>
    createWorklogProfile(`P${i + 1}`, entries)
  );
  saveWorklogProfiles(
    { activeId: created[0].id, profiles: created },
    projectId
  );
}

describe('useWorklogProfiles', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => jest.useRealTimers());

  // --- Managing profiles ---

  it('duplicates a profile with all its rows and makes the copy active', () => {
    seed('A', [entry('ABC-1'), entry('ABC-2')]);
    const { result } = renderHook(() => useWorklogProfiles('A'));
    const sourceId = result.current.activeProfile.id;

    act(() => {
      result.current.duplicateProfile(sourceId);
    });

    expect(result.current.activeProfile.id).not.toBe(sourceId);
    expect(result.current.activeProfile.name).toBe('P1 copy');
    expect(result.current.entries.map(e => e.issueKey)).toEqual([
      'ABC-1',
      'ABC-2',
    ]);
  });

  // --- Saving ---

  it('saves after a short delay rather than on every change', () => {
    seed('A', [entry('ABC-1')]);
    const { result } = renderHook(() => useWorklogProfiles('A'));

    act(() => result.current.setEntries(prev => [...prev, entry('ABC-2')]));
    expect(savedKeys('A')).toEqual(['ABC-1']);

    act(() => jest.advanceTimersByTime(PROFILE_SAVE_DELAY_MS));
    expect(savedKeys('A')).toEqual(['ABC-1', 'ABC-2']);
  });

  it('flushes pending edits to the old project when the project changes', () => {
    seed('A', [entry('ABC-1')]);
    seed('B', [entry('XYZ-1')]);
    const { result, rerender } = renderHook(
      ({ projectId }) => useWorklogProfiles(projectId),
      { initialProps: { projectId: 'A' } }
    );

    act(() => result.current.setEntries(prev => [...prev, entry('ABC-2')]));
    rerender({ projectId: 'B' });

    expect(savedKeys('A')).toEqual(['ABC-1', 'ABC-2']);
    expect(result.current.entries.map(e => e.issueKey)).toEqual(['XYZ-1']);
  });

  it('flushes pending edits on unmount', () => {
    seed('A', [entry('ABC-1')]);
    const { result, unmount } = renderHook(() => useWorklogProfiles('A'));

    act(() => result.current.setEntries(prev => [...prev, entry('ABC-2')]));
    unmount();

    expect(savedKeys('A')).toEqual(['ABC-1', 'ABC-2']);
  });

  // --- Other tabs ---

  it('picks up a profile another tab saved before saving its own edit', () => {
    seed('A', [entry('ABC-1')]);
    const { result } = renderHook(() => useWorklogProfiles('A'));

    // Another tab adds a "Support" profile.
    const other = loadWorklogProfiles('A');
    saveWorklogProfiles(
      {
        ...other,
        profiles: [
          ...other.profiles,
          createWorklogProfile('Support', [entry('SUP-1')]),
        ],
      },
      'A'
    );
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: worklogProfilesStorageKey('A') })
      );
    });

    act(() => result.current.setEntries(prev => [...prev, entry('ABC-2')]));
    act(() => jest.advanceTimersByTime(PROFILE_SAVE_DELAY_MS));

    const saved = loadWorklogProfiles('A');
    expect(saved.profiles.map(p => p.name)).toEqual(['P1', 'Support']);
    expect(savedKeys('A')).toEqual(['ABC-1', 'ABC-2']);
  });

  it('stays on its own profile and does not write back after a reload', () => {
    seed('A', [entry('ABC-1')], [entry('XYZ-1')]);
    const { result } = renderHook(() => useWorklogProfiles('A'));
    const second = result.current.profiles[1].id;
    act(() => result.current.selectProfile(second));
    act(() => jest.advanceTimersByTime(PROFILE_SAVE_DELAY_MS));

    // Another tab switches back to the first profile and saves.
    const other = loadWorklogProfiles('A');
    saveWorklogProfiles({ ...other, activeId: other.profiles[0].id }, 'A');
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: worklogProfilesStorageKey('A') })
      );
    });
    act(() => jest.advanceTimersByTime(PROFILE_SAVE_DELAY_MS));

    expect(result.current.activeProfile.id).toBe(second);
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it('names the placeholder profile "Default" before a project is chosen', () => {
    const { result } = renderHook(() => useWorklogProfiles(undefined));

    expect(result.current.activeProfile.name).toBe('Default');
  });

  it('creates, renames and deletes profiles, never deleting the last one', () => {
    const { result } = renderHook(() => useWorklogProfiles('A'));
    const defaultId = result.current.activeProfile.id;

    let newId = '';
    act(() => {
      newId = result.current.createProfile();
    });
    expect(result.current.activeProfile).toMatchObject({
      id: newId,
      name: 'Profile 2',
    });

    act(() => result.current.renameProfile(newId, '  Support  '));
    expect(result.current.activeProfile.name).toBe('Support');

    act(() => result.current.deleteProfile(newId));
    expect(result.current.activeProfile.id).toBe(defaultId);

    act(() => result.current.deleteProfile(defaultId));
    expect(result.current.profiles).toHaveLength(1);
  });
});
