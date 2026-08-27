import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MissingWorklogsCard } from './missing-worklogs-card';

// --- Mock UI primitives ---

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), info: jest.fn() },
}));

jest.mock('@workspace/ui/components/date-range-picker', () => ({
  DateRangePicker: () => <div data-testid="date-range-picker" />,
}));

jest.mock('@workspace/ui/components/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// The calendar exposes its `disabled` matcher so the test can assert which
// days manual picking blocks.
let calendarDisabled: ((date: Date) => boolean) | undefined;
jest.mock('@workspace/ui/components/calendar', () => ({
  Calendar: ({ disabled }: { disabled?: (date: Date) => boolean }) => {
    calendarDisabled = disabled;
    return <div data-testid="calendar" />;
  },
}));

jest.mock('@workspace/ui/components/checkbox', () => ({
  Checkbox: ({ checked }: { checked?: boolean }) => (
    <input type="checkbox" readOnly checked={!!checked} />
  ),
}));

jest.mock('./date-chip-list', () => ({
  DateChipList: ({ dates }: { dates: Date[] }) => (
    <div data-testid="date-chip-list">{dates.length}</div>
  ),
}));

// 2/Jan/26 Fri, 3/Jan/26 Sat, 4/Jan/26 Sun, 5/Jan/26 Mon
const API_DATES = '2/Jan/26,3/Jan/26,4/Jan/26,5/Jan/26';

function renderCard(
  overrides: Partial<React.ComponentProps<typeof MissingWorklogsCard>> = {}
) {
  const props = {
    selectedProjectId: 'PROJ',
    warningFromDate: '2026-01-01',
    warningToDate: '2026-01-31',
    onWarningFromDateChange: jest.fn(),
    onWarningToDateChange: jest.fn(),
    isSearchingWarnings: false,
    onSearchWarnings: jest
      .fn()
      .mockResolvedValue({ dates: API_DATES, count: 4 }),
    selectedDates: [] as Date[],
    onSelectedDatesChange: jest.fn(),
    parsedDates: [] as string[],
    onClearAllDates: jest.fn(),
    includeWeekends: false,
    onIncludeWeekendsChange: jest.fn(),
    ...overrides,
  };
  render(<MissingWorklogsCard {...props} />);
  return props;
}

beforeEach(() => {
  calendarDisabled = undefined;
  jest.clearAllMocks();
});

// --- Find Dates ---

it('keeps weekends returned by the API when include weekends is off', async () => {
  const user = userEvent.setup();
  const props = renderCard({ includeWeekends: false });

  await user.click(screen.getByRole('button', { name: /find dates/i }));

  expect(props.onSelectedDatesChange).toHaveBeenCalledTimes(1);
  const dates = props.onSelectedDatesChange.mock.calls[0][0] as Date[];
  expect(dates.map(d => d.toDateString())).toEqual([
    'Fri Jan 02 2026',
    'Sat Jan 03 2026',
    'Sun Jan 04 2026',
    'Mon Jan 05 2026',
  ]);
});

it('skips dates the API returns in an unparseable format', async () => {
  const user = userEvent.setup();
  const props = renderCard({
    onSearchWarnings: jest
      .fn()
      .mockResolvedValue({ dates: '2/Jan/26,not-a-date', count: 2 }),
  });

  await user.click(screen.getByRole('button', { name: /find dates/i }));

  const dates = props.onSelectedDatesChange.mock.calls[0][0] as Date[];
  expect(dates).toHaveLength(1);
});

// --- Manual picking ---

it('disables unselected weekends in the calendar when include weekends is off', () => {
  renderCard({ includeWeekends: false });

  expect(calendarDisabled?.(new Date(2026, 0, 3))).toBe(true); // Sat
  expect(calendarDisabled?.(new Date(2026, 0, 2))).toBe(false); // Fri
});

it('leaves already-selected weekends selectable so they can be removed', () => {
  renderCard({
    includeWeekends: false,
    selectedDates: [new Date(2026, 0, 3)],
  });

  expect(calendarDisabled?.(new Date(2026, 0, 3))).toBe(false);
  expect(calendarDisabled?.(new Date(2026, 0, 10))).toBe(true);
});

it('allows every day in the calendar when include weekends is on', () => {
  renderCard({ includeWeekends: true });

  expect(calendarDisabled).toBeUndefined();
});
