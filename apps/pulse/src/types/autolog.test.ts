import {
  formatNextRun,
  formatScheduleSlot,
  formatScheduleWeekday,
} from './autolog';
import type { AutologSchedule } from './autolog';

/** Fri 21 Aug 2026, 19:56 Asia/Ho_Chi_Minh. */
const ANCHOR = '2026-08-21T12:56:00.000Z';

function schedule(overrides: Partial<AutologSchedule> = {}): AutologSchedule {
  return {
    type: 'weekly',
    timezone: 'Asia/Ho_Chi_Minh',
    nextRunAt: ANCHOR,
    periodAnchorAt: ANCHOR,
    attempt: 0,
    ...overrides,
  };
}

describe('formatScheduleSlot', () => {
  it('renders the slot in the config timezone', () => {
    expect(formatScheduleSlot(schedule())).toBe('7:56 PM GMT+7');
  });

  it('renders the same instant differently per timezone', () => {
    expect(
      formatScheduleSlot(schedule({ timezone: 'America/Los_Angeles' }))
    ).toBe('5:56 AM PDT');
  });

  it('describes the recurring slot, not an in-flight retry', () => {
    // During a retry nextRunAt holds a backoff instant; showing it would tell
    // the user their schedule had moved, which it has not.
    const retrying = schedule({
      nextRunAt: '2026-08-21T13:11:00.000Z',
      attempt: 1,
    });
    expect(formatScheduleSlot(retrying)).toBe('7:56 PM GMT+7');
  });

  it('returns null when the config has not been scheduled yet', () => {
    expect(formatScheduleSlot(schedule({ periodAnchorAt: '' }))).toBeNull();
    expect(
      formatScheduleSlot(schedule({ periodAnchorAt: 'nonsense' }))
    ).toBeNull();
  });
});

describe('formatScheduleWeekday', () => {
  it('uses the local weekday, not the UTC one', () => {
    // 19:56 Friday in LA is already Saturday in UTC.
    const la = schedule({
      timezone: 'America/Los_Angeles',
      periodAnchorAt: '2026-08-22T02:56:00.000Z',
    });
    expect(new Date(la.periodAnchorAt).getUTCDay()).toBe(6); // Saturday
    expect(formatScheduleWeekday(la)).toBe('Friday');
  });

  it('returns null without an anchor', () => {
    expect(formatScheduleWeekday(schedule({ periodAnchorAt: '' }))).toBeNull();
  });
});

describe('formatNextRun', () => {
  it('renders the next attempt as an absolute local date and time', () => {
    expect(formatNextRun(schedule())).toBe('Fri, Aug 21, 2026, 7:56 PM GMT+7');
  });

  it('reflects a retry instant rather than the regular slot', () => {
    expect(
      formatNextRun(schedule({ nextRunAt: '2026-08-21T13:11:00.000Z' }))
    ).toBe('Fri, Aug 21, 2026, 8:11 PM GMT+7');
  });

  it('returns null when there is no next run', () => {
    expect(formatNextRun(schedule({ nextRunAt: '' }))).toBeNull();
  });
});
