import { act, renderHook } from '@testing-library/react';

import {
  createDefaultEntry,
  failedWorklogsStorageKey,
  loadFailedWorklogs,
  saveFailedWorklogs,
} from '@/lib/timesheet';
import type { FailedWorklog } from '@/types/timesheet';

import { useFailedWorklogs } from './use-failed-worklogs';

const item = (issueKey: string): FailedWorklog => ({
  entry: { ...createDefaultEntry(), issueKey },
  ranges: [{ startDate: '4/May/26', endDate: '4/May/26', dates: ['4/May/26'] }],
});

describe('useFailedWorklogs', () => {
  beforeEach(() => localStorage.clear());

  it('applies updates to what is in storage, not a stale copy', () => {
    saveFailedWorklogs([item('ABC-1'), item('ABC-2')], 'P1');
    const { result } = renderHook(() => useFailedWorklogs('P1'));

    // Another tab retried ABC-1 successfully after this one loaded.
    saveFailedWorklogs([loadFailedWorklogs('P1')[1]], 'P1');
    act(() =>
      result.current.updateFailedWorklogs(prev =>
        prev.filter(f => f.entry.issueKey !== 'ABC-2')
      )
    );

    expect(loadFailedWorklogs('P1')).toEqual([]);
    expect(result.current.failedWorklogs).toEqual([]);
  });

  it('reloads when another tab changes the list', () => {
    const { result } = renderHook(() => useFailedWorklogs('P1'));
    expect(result.current.failedWorklogs).toEqual([]);

    saveFailedWorklogs([item('ABC-1')], 'P1');
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: failedWorklogsStorageKey('P1') })
      );
    });

    expect(result.current.failedWorklogs.map(f => f.entry.issueKey)).toEqual([
      'ABC-1',
    ]);
  });

  it('switches lists with the project', () => {
    saveFailedWorklogs([item('ABC-1')], 'P1');
    const { result, rerender } = renderHook(
      ({ projectId }) => useFailedWorklogs(projectId),
      { initialProps: { projectId: 'P1' } }
    );
    expect(result.current.failedWorklogs).toHaveLength(1);

    rerender({ projectId: 'P2' });
    expect(result.current.failedWorklogs).toEqual([]);
  });

  it('keeps a run that ends after a project switch out of the new list', () => {
    const { result, rerender } = renderHook(
      ({ projectId }) => useFailedWorklogs(projectId),
      { initialProps: { projectId: 'P1' } }
    );
    // The run started on P1 holds P1's updater.
    const updateP1 = result.current.updateFailedWorklogs;

    rerender({ projectId: 'P2' });
    act(() => updateP1(() => [item('ABC-1')]));

    expect(result.current.failedWorklogs).toEqual([]);
    expect(loadFailedWorklogs('P1').map(f => f.entry.issueKey)).toEqual([
      'ABC-1',
    ]);
    expect(loadFailedWorklogs('P2')).toEqual([]);
  });
});
