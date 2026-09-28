import { act, renderHook } from '@testing-library/react';

import { createDefaultEntry } from '@/lib/timesheet';
import type {
  DateRange,
  RunOutcome,
  TimesheetSettings,
} from '@/types/timesheet';

import { useLogWorkSubmission } from './use-log-work-submission';

const EMPTY: RunOutcome = { results: [], statuses: [] };

const settings = {
  jiraInstance: 'jiradc',
  username: 'me',
  token: 'pat',
} as TimesheetSettings;

const range = (...dates: string[]): DateRange => ({
  startDate: dates[0],
  endDate: dates[dates.length - 1],
  dates,
});

describe('useLogWorkSubmission', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => jest.useRealTimers());

  it('sends each row only for its own ranges in submitWork', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    const rowA = { ...createDefaultEntry(), issueKey: 'ABC-1' };
    const rowB = { ...createDefaultEntry(), issueKey: 'ABC-2' };
    const { result } = renderHook(() => useLogWorkSubmission(settings));

    let done: Promise<unknown> = Promise.resolve();
    act(() => {
      done = result.current.submitWork([
        { entry: rowA, ranges: [range('7/May/26')] },
        { entry: rowB, ranges: [range('4/May/26', '5/May/26')] },
      ]);
    });
    await act(async () => {
      await jest.runAllTimersAsync();
      await done;
    });

    const sent = fetchMock.mock.calls.map(
      ([, init]) => JSON.parse(init.body).worklog
    );
    expect(sent).toEqual([
      expect.objectContaining({
        issueKey: 'ABC-1',
        startDate: '7/May/26',
        endDate: '7/May/26',
      }),
      expect.objectContaining({
        issueKey: 'ABC-2',
        startDate: '4/May/26',
        endDate: '5/May/26',
      }),
    ]);
    expect(result.current.requestStatuses.map(s => s.status)).toEqual([
      'success',
      'success',
    ]);
  });

  it('sends every row for every range in submitEntries, skipping keyless rows', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    const rowA = { ...createDefaultEntry(), issueKey: 'ABC-1' };
    const blank = createDefaultEntry();
    const { result } = renderHook(() => useLogWorkSubmission(settings));

    let done: Promise<unknown> = Promise.resolve();
    act(() => {
      done = result.current.submitEntries({
        entries: [rowA, blank],
        ranges: [range('4/May/26'), range('7/May/26')],
      });
    });
    await act(async () => {
      await jest.runAllTimersAsync();
      await done;
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.requestStatuses).toHaveLength(2);
  });

  it('keeps the in-flight result and skips the rest when cancelled', async () => {
    const rows = ['ABC-1', 'ABC-2', 'ABC-3'].map(issueKey => ({
      ...createDefaultEntry(),
      issueKey,
    }));
    const { result } = renderHook(() => useLogWorkSubmission(settings));

    let resolveFirst: (value: unknown) => void = () => {};
    fetchMock.mockImplementationOnce(
      () => new Promise(resolve => (resolveFirst = resolve))
    );

    let done: Promise<RunOutcome> = Promise.resolve(EMPTY);
    act(() => {
      done = result.current.submitWork(
        rows.map(entry => ({ entry, ranges: [range('4/May/26')] }))
      );
    });
    act(() => result.current.cancelSubmission());
    let outcome = EMPTY;
    await act(async () => {
      resolveFirst({ ok: false, status: 500, json: async () => ({}) });
      await jest.runAllTimersAsync();
      outcome = await done;
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(outcome.statuses.map(s => s.status)).toEqual([
      'failed',
      'skipped',
      'skipped',
    ]);
    expect(outcome.results.map(r => r.error)).toEqual([
      '4/May/26: HTTP 500',
      'Cancelled',
      'Cancelled',
    ]);
  });

  it('re-sends only the failed ranges on retry and reports the whole run', async () => {
    const row = { ...createDefaultEntry(), issueKey: 'ABC-1' };
    const { result } = renderHook(() => useLogWorkSubmission(settings));
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValue({ ok: true, json: async () => ({}) });

    let done: Promise<RunOutcome> = Promise.resolve(EMPTY);
    act(() => {
      done = result.current.submitWork([
        { entry: row, ranges: [range('4/May/26'), range('7/May/26')] },
      ]);
    });
    await act(async () => {
      await jest.runAllTimersAsync();
      await done;
    });

    let outcome = EMPTY;
    await act(async () => {
      const retry = result.current.retryFailed();
      await jest.runAllTimersAsync();
      outcome = await retry;
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body).worklog.startDate).toBe(
      '7/May/26'
    );
    expect(outcome.results).toEqual([
      expect.objectContaining({ success: true }),
    ]);
  });
});
