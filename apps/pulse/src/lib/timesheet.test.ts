import type { RequestStatus, WorkEntry } from '@/types/timesheet';

import {
  DEFAULT_PROFILE_NAME,
  collectFailedWorklogs,
  createDefaultEntry,
  createWorklogProfile,
  loadFailedWorklogs,
  loadSavedEntries,
  loadWorklogProfiles,
  nextProfileName,
  parseWarningEntries,
  reconcileFailedWorklogs,
  saveFailedWorklogs,
  saveWorklogProfiles,
} from './timesheet';

describe('parseWarningEntries', () => {
  it('splits the comma-separated dates into a list per user', () => {
    const result = parseWarningEntries([
      { key: 'anhvnt2', value: '14/Aug/26' },
      {
        key: 'anhnd137',
        value: '03/Aug/26, 04/Aug/26, 05/Aug/26',
      },
    ]);

    expect(result).toEqual([
      {
        username: 'anhnd137',
        dates: ['03/Aug/26', '04/Aug/26', '05/Aug/26'],
        count: 3,
      },
      { username: 'anhvnt2', dates: ['14/Aug/26'], count: 1 },
    ]);
  });

  it('sorts each user dates chronologically', () => {
    const [user] = parseWarningEntries([
      { key: 'baohq11', value: '10/Aug/26, 03/Aug/26, 14/Sep/26, 28/Jul/26' },
    ]);

    expect(user.dates).toEqual([
      '28/Jul/26',
      '03/Aug/26',
      '10/Aug/26',
      '14/Sep/26',
    ]);
  });

  it('sorts users by most missing days, then by username', () => {
    const result = parseWarningEntries([
      { key: 'zed', value: '03/Aug/26' },
      { key: 'alice', value: '03/Aug/26' },
      { key: 'bob', value: '03/Aug/26, 04/Aug/26' },
    ]);

    expect(result.map(user => user.username)).toEqual(['bob', 'alice', 'zed']);
  });

  it('drops users without any missing dates', () => {
    const result = parseWarningEntries([
      { key: 'nobody', value: '' },
      { key: 'blank', value: '  ,  ' },
      { key: 'baohq11', value: '03/Aug/26' },
    ]);

    expect(result.map(user => user.username)).toEqual(['baohq11']);
  });

  it('returns an empty list for an empty response', () => {
    expect(parseWarningEntries([])).toEqual([]);
  });
});

describe('worklog profiles', () => {
  const entry = (issueKey: string) => ({
    ...createDefaultEntry(),
    issueKey,
    description: `Work on ${issueKey}`,
  });

  beforeEach(() => localStorage.clear());

  it('starts a project with no saved data on one empty default profile', () => {
    const store = loadWorklogProfiles('P1');

    expect(store.profiles).toHaveLength(1);
    expect(store.profiles[0].name).toBe(DEFAULT_PROFILE_NAME);
    expect(store.activeId).toBe(store.profiles[0].id);
    expect(store.profiles[0].entries).toHaveLength(1);
    expect(store.profiles[0].entries[0].issueKey).toBe('');
  });

  it('migrates the pre-profiles entry list into the default profile', () => {
    localStorage.setItem(
      'timesheet_saved_entries::project::P1',
      JSON.stringify([
        { issueKey: 'ABC-1', typeOfWork: 'Create', description: 'x', hours: 2 },
      ])
    );

    const store = loadWorklogProfiles('P1');

    expect(store.profiles).toHaveLength(1);
    expect(store.profiles[0].entries.map(e => e.issueKey)).toEqual(['ABC-1']);
  });

  it('round-trips profiles and the active id, dropping blank rows', () => {
    const a = createWorklogProfile('Sprint', [
      entry('ABC-1'),
      createDefaultEntry(),
    ]);
    const b = createWorklogProfile('Support', [entry('ABC-2')]);
    saveWorklogProfiles({ activeId: b.id, profiles: [a, b] }, 'P1');

    const store = loadWorklogProfiles('P1');

    expect(store.activeId).toBe(b.id);
    expect(store.profiles.map(p => p.name)).toEqual(['Sprint', 'Support']);
    expect(store.profiles[0].entries.map(e => e.issueKey)).toEqual(['ABC-1']);
    expect(loadSavedEntries('P1').map(e => e.issueKey)).toEqual(['ABC-2']);
  });

  it('keeps a row whose ticket was cleared but still has a description', () => {
    const a = createWorklogProfile('Sprint', [entry('')]);
    saveWorklogProfiles({ activeId: a.id, profiles: [a] }, 'P1');

    expect(loadWorklogProfiles('P1').profiles[0].entries).toEqual([
      expect.objectContaining({ issueKey: '', description: 'Work on ' }),
    ]);
  });

  it('prefills Autolog with only the rows that have a ticket', () => {
    const a = createWorklogProfile('Sprint', [entry(''), entry('ABC-1')]);
    saveWorklogProfiles({ activeId: a.id, profiles: [a] }, 'P1');

    expect(loadSavedEntries('P1').map(e => e.issueKey)).toEqual(['ABC-1']);
  });

  it('keeps profiles separate per project', () => {
    const a = createWorklogProfile('Sprint', [entry('ABC-1')]);
    saveWorklogProfiles({ activeId: a.id, profiles: [a] }, 'P1');

    expect(loadWorklogProfiles('P2').profiles[0].name).toBe(
      DEFAULT_PROFILE_NAME
    );
  });

  it('falls back to the first profile when the active id is unknown', () => {
    const a = createWorklogProfile('Sprint', [entry('ABC-1')]);
    saveWorklogProfiles({ activeId: 'missing', profiles: [a] }, 'P1');

    expect(loadWorklogProfiles('P1').activeId).toBe(a.id);
  });

  it('ignores corrupted storage', () => {
    localStorage.setItem('timesheet_worklog_profiles::project::P1', '{nope');

    expect(loadWorklogProfiles('P1').profiles).toHaveLength(1);
  });

  it('names new profiles by count, skipping names already taken', () => {
    const profiles = [
      createWorklogProfile('Default'),
      createWorklogProfile('Profile 3'),
    ];

    expect(nextProfileName(profiles)).toBe('Profile 4');
    expect(nextProfileName([createWorklogProfile('Default')])).toBe(
      'Profile 2'
    );
  });
});

describe('failed worklogs', () => {
  const rowA = { ...createDefaultEntry(), issueKey: 'ABC-1', description: 'a' };
  const rowB = { ...createDefaultEntry(), issueKey: 'ABC-2', description: 'b' };
  const entriesById = new Map([
    [rowA.id, rowA],
    [rowB.id, rowB],
  ]);

  const status = (
    entryId: string,
    dates: string[],
    state: RequestStatus['status'],
    error?: string
  ): RequestStatus => ({
    entryId,
    issueKey: entriesById.get(entryId)?.issueKey ?? 'ABC-1',
    rangeLabel:
      dates.length > 1 ? `${dates[0]} → ${dates[dates.length - 1]}` : dates[0],
    dates,
    status: state,
    error,
  });

  beforeEach(() => localStorage.clear());

  it('keeps only the ranges each row still needs', () => {
    const failed = collectFailedWorklogs(
      [
        status(rowA.id, ['4/May/26', '5/May/26'], 'success'),
        status(rowA.id, ['7/May/26'], 'failed', 'Holiday'),
        status(rowB.id, ['4/May/26', '5/May/26'], 'failed', 'HTTP 500'),
        status(rowB.id, ['7/May/26'], 'success'),
      ],
      entriesById
    );

    expect(failed).toHaveLength(2);
    expect(failed[0].entry).toMatchObject({ issueKey: 'ABC-1' });
    expect(failed[0].ranges).toEqual([
      { startDate: '7/May/26', endDate: '7/May/26', dates: ['7/May/26'] },
    ]);
    expect(failed[0].error).toBe('7/May/26: Holiday');
    expect(failed[1].ranges).toEqual([
      {
        startDate: '4/May/26',
        endDate: '5/May/26',
        dates: ['4/May/26', '5/May/26'],
      },
    ]);
  });

  it('treats skipped and never-sent ranges as still missing', () => {
    const failed = collectFailedWorklogs(
      [
        status(rowA.id, ['4/May/26'], 'skipped'),
        status(rowB.id, ['4/May/26'], 'pending'),
      ],
      entriesById
    );

    expect(failed.map(f => f.error)).toEqual([
      '4/May/26: Not sent',
      '4/May/26: Not sent',
    ]);
  });

  it('gives each failed row a fresh id, separate from the profile row', () => {
    const [failed] = collectFailedWorklogs(
      [status(rowA.id, ['4/May/26'], 'failed')],
      entriesById
    );

    expect(failed.entry.id).not.toBe(rowA.id);
  });

  it('returns nothing when every range succeeded', () => {
    expect(
      collectFailedWorklogs(
        [status(rowA.id, ['4/May/26'], 'success')],
        entriesById
      )
    ).toEqual([]);
  });

  it('round-trips per project and removes the key when emptied', () => {
    const [failed] = collectFailedWorklogs(
      [status(rowA.id, ['4/May/26'], 'failed')],
      entriesById
    );

    saveFailedWorklogs([failed], 'P1');
    expect(loadFailedWorklogs('P1')).toEqual([failed]);
    expect(loadFailedWorklogs('P2')).toEqual([]);

    saveFailedWorklogs([], 'P1');
    expect(localStorage.getItem('timesheet_failed_worklogs::project::P1')).toBe(
      null
    );
  });

  it('drops malformed stored items', () => {
    localStorage.setItem(
      'timesheet_failed_worklogs::project::P1',
      JSON.stringify([
        { entry: null },
        { entry: rowA, ranges: [] },
        { entry: rowA, ranges: [{}] },
        {
          entry: rowA,
          ranges: [{ startDate: 'x', endDate: 'x', dates: ['not a date'] }],
        },
        {
          entry: { id: 'x', issueKey: 'A-1' },
          ranges: [
            { startDate: '4/May/26', endDate: '4/May/26', dates: ['4/May/26'] },
          ],
        },
      ])
    );

    expect(loadFailedWorklogs('P1')).toEqual([]);
  });

  it('drops failures that a later run logged, even from a normal submit', () => {
    const first = reconcileFailedWorklogs(
      [],
      [status(rowA.id, ['4/May/26', '5/May/26'], 'failed', 'HTTP 401')],
      entriesById
    );
    expect(first).toHaveLength(1);

    const resubmitted = { ...rowA, id: 'fresh-profile-row' };
    const after = reconcileFailedWorklogs(
      first,
      [status(resubmitted.id, ['4/May/26', '5/May/26'], 'success')],
      new Map([[resubmitted.id, resubmitted]])
    );

    expect(after).toEqual([]);
  });

  it('keeps only the dates a later run did not log', () => {
    const first = reconcileFailedWorklogs(
      [],
      [status(rowA.id, ['4/May/26', '5/May/26', '6/May/26'], 'failed')],
      entriesById
    );
    const sameWork = { ...rowA, id: 'other-row' };
    const after = reconcileFailedWorklogs(
      first,
      [status(sameWork.id, ['5/May/26'], 'success')],
      new Map([[sameWork.id, sameWork]])
    );

    expect(after[0].ranges).toEqual([
      { startDate: '4/May/26', endDate: '4/May/26', dates: ['4/May/26'] },
      { startDate: '6/May/26', endDate: '6/May/26', dates: ['6/May/26'] },
    ]);
  });

  it('keeps a failed row when other work on the same ticket and date logged', () => {
    const review: WorkEntry = {
      ...rowA,
      id: 'review',
      typeOfWork: 'Review',
      hours: 2,
    };
    const create: WorkEntry = {
      ...rowA,
      id: 'create',
      typeOfWork: 'Create',
      hours: 6,
    };
    const after = reconcileFailedWorklogs(
      [],
      [
        { ...status(review.id, ['4/May/26'], 'success'), issueKey: 'ABC-1' },
        {
          ...status(create.id, ['4/May/26'], 'failed', 'HTTP 500'),
          issueKey: 'ABC-1',
        },
      ],
      new Map([
        [review.id, review],
        [create.id, create],
      ])
    );

    expect(after).toHaveLength(1);
    expect(after[0].entry).toMatchObject({ typeOfWork: 'Create', hours: 6 });
    expect(after[0].ranges[0].dates).toEqual(['4/May/26']);
  });

  it('merges repeated failures of the same work into one item', () => {
    const once = reconcileFailedWorklogs(
      [],
      [status(rowA.id, ['4/May/26'], 'failed')],
      entriesById
    );
    const twice = reconcileFailedWorklogs(
      once,
      [status(rowA.id, ['4/May/26', '5/May/26'], 'failed', 'HTTP 500')],
      entriesById
    );

    expect(twice).toHaveLength(1);
    expect(twice[0].ranges).toEqual([
      {
        startDate: '4/May/26',
        endDate: '5/May/26',
        dates: ['4/May/26', '5/May/26'],
      },
    ]);
    expect(twice[0].error).toBe('4/May/26 → 5/May/26: HTTP 500');
  });
});
