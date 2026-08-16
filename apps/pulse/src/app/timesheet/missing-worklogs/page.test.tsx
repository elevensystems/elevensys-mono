import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { MissingWorklogUser } from '@/types/timesheet';

import MissingWorklogsPage from './page';

// --- Mock hooks ---

const mockUseTimesheetSettings = jest.fn();
jest.mock('@/hooks/use-timesheet-settings', () => ({
  useTimesheetSettings: () => mockUseTimesheetSettings(),
}));

const mockHandleSearch = jest.fn();
const mockSetSelectedProject = jest.fn();
const mockSetUsername = jest.fn();
const mockSetFromDate = jest.fn();
const mockSetToDate = jest.fn();

const mockUseMissingWorklogsReport = jest.fn();
jest.mock('@/hooks/use-missing-worklogs-report', () => ({
  useMissingWorklogsReport: () => mockUseMissingWorklogsReport(),
}));

// --- Mock layouts ---

jest.mock('@/components/layouts/main-layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}));

jest.mock('@/components/layouts/tool-page-header', () => ({
  ToolPageHeader: ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: React.ReactNode;
  }) => (
    <div data-testid="tool-page-header">
      <h1>{title}</h1>
      <div data-testid="header-subtitle">{subtitle}</div>
    </div>
  ),
}));

jest.mock('@/components/features/timesheet/not-configured-alert', () => ({
  NotConfiguredAlert: ({ isConfigured }: { isConfigured: boolean }) =>
    isConfigured ? null : <div data-testid="not-configured-alert" />,
}));

jest.mock('@/components/features/timesheet/token-expired-alert', () => ({
  TokenExpiredAlert: ({ authError }: { authError: boolean }) =>
    authError ? <div data-testid="token-expired-alert" /> : null,
}));

jest.mock('@/components/features/timesheet/user-selector', () => ({
  UserSelector: ({
    id,
    value,
    onChange,
    disabled,
  }: {
    id?: string;
    value: string;
    onChange: (username: string) => void;
    disabled?: boolean;
    className?: string;
  }) => (
    <input
      id={id}
      data-testid="user-selector"
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder="All users"
      disabled={disabled}
    />
  ),
}));

// --- Mock child components ---

jest.mock('./_components/missing-user-row', () => ({
  MissingUserRow: ({ no, user }: { no: number; user: MissingWorklogUser }) => (
    <tr data-testid={`missing-user-row-${user.username}`}>
      <td>{no}</td>
      <td>{user.username}</td>
      <td>{user.count}</td>
    </tr>
  ),
}));

// --- Mock UI components ---

jest.mock('lucide-react', () => ({
  Copy: () => <span data-testid="icon-copy" />,
  Search: () => <span data-testid="icon-search" />,
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@workspace/ui/components/spinner', () => ({
  Spinner: () => <span data-testid="icon-loader" />,
}));

jest.mock('@workspace/ui/components/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
  }) => <button {...props}>{children}</button>,
}));

jest.mock('@workspace/ui/components/combobox', () => ({
  Combobox: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="project-combobox">{children}</div>
  ),
  ComboboxContent: () => null,
  ComboboxEmpty: () => null,
  ComboboxInput: ({
    placeholder,
    disabled,
  }: {
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
    showClear?: boolean;
  }) => (
    <input
      data-testid="project-input"
      placeholder={placeholder}
      disabled={disabled}
      readOnly
    />
  ),
  ComboboxItem: () => null,
  ComboboxList: () => null,
}));

jest.mock('@workspace/ui/components/date-range-picker', () => ({
  DateRangePicker: ({
    onRangeChange,
  }: {
    onRangeChange?: (from: string, to: string) => void;
  }) => (
    <div data-testid="date-range-picker">
      <button
        data-testid="change-date-range"
        onClick={() => onRangeChange?.('2026-08-01', '2026-08-15')}
      />
    </div>
  ),
}));

jest.mock('@workspace/ui/components/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

jest.mock('@workspace/ui/components/label', () => ({
  Label: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    htmlFor?: string;
  }) => <label {...props}>{children}</label>,
}));

jest.mock('@workspace/ui/components/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

jest.mock('@workspace/ui/components/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => (
    <table>{children}</table>
  ),
  TableBody: ({ children }: { children: React.ReactNode }) => (
    <tbody>{children}</tbody>
  ),
  TableHead: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
  } & React.HTMLAttributes<HTMLTableCellElement>) => (
    <th {...props}>{children}</th>
  ),
  TableHeader: ({ children }: { children: React.ReactNode }) => (
    <thead>{children}</thead>
  ),
  TableRow: ({ children }: { children: React.ReactNode }) => (
    <tr>{children}</tr>
  ),
}));

// --- Test data ---

const configuredSettings = {
  settings: {
    username: 'testuser',
    token: 'test-token',
    jiraInstance: 'jiradc',
  },
  isConfigured: true,
  isLoaded: true,
};

const sampleRows: MissingWorklogUser[] = [
  {
    username: 'anhnd137',
    dates: ['03/Aug/26', '04/Aug/26', '05/Aug/26'],
    count: 3,
  },
  { username: 'anhvnt2', dates: ['14/Aug/26'], count: 1 },
];

const defaultReportReturn = {
  projects: [{ id: '12613', key: 'PROJ', name: 'Project One' }],
  projectsLoading: false,
  authError: false,
  selectedProject: { id: '12613', key: 'PROJ', name: 'Project One' },
  setSelectedProject: mockSetSelectedProject,
  username: '',
  setUsername: mockSetUsername,
  fromDate: '2026-08-01',
  setFromDate: mockSetFromDate,
  toDate: '2026-08-15',
  setToDate: mockSetToDate,
  rows: [] as MissingWorklogUser[],
  isLoading: false,
  error: '',
  hasSearched: false,
  handleSearch: mockHandleSearch,
};

// --- Tests ---

describe('MissingWorklogsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTimesheetSettings.mockReturnValue(configuredSettings);
    mockUseMissingWorklogsReport.mockReturnValue(defaultReportReturn);
  });

  // --- Loading state ---

  it('renders a spinner while settings are loading', () => {
    mockUseTimesheetSettings.mockReturnValue({
      ...configuredSettings,
      isLoaded: false,
    });
    render(<MissingWorklogsPage />);
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
    expect(screen.queryByText('Missing Worklogs')).not.toBeInTheDocument();
  });

  // --- Empty states ---

  it('renders the initial empty state before searching', () => {
    render(<MissingWorklogsPage />);
    expect(screen.getByText('Missing Worklogs')).toBeInTheDocument();
    expect(screen.getByText(/Pick a date range/)).toBeInTheDocument();
  });

  it('prompts for a project when none is scoped', () => {
    mockUseMissingWorklogsReport.mockReturnValue({
      ...defaultReportReturn,
      selectedProject: null,
    });
    render(<MissingWorklogsPage />);
    expect(
      screen.getByText(/Choose a project in the header/)
    ).toBeInTheDocument();
  });

  it('renders the no-results message after searching', () => {
    mockUseMissingWorklogsReport.mockReturnValue({
      ...defaultReportReturn,
      hasSearched: true,
    });
    render(<MissingWorklogsPage />);
    expect(
      screen.getByText('No missing worklogs for this range.')
    ).toBeInTheDocument();
  });

  it('renders skeleton rows while loading results', () => {
    mockUseMissingWorklogsReport.mockReturnValue({
      ...defaultReportReturn,
      isLoading: true,
    });
    render(<MissingWorklogsPage />);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  // --- Results ---

  it('renders one row per user with missing worklogs', () => {
    mockUseMissingWorklogsReport.mockReturnValue({
      ...defaultReportReturn,
      rows: sampleRows,
      hasSearched: true,
    });
    render(<MissingWorklogsPage />);
    expect(screen.getByTestId('missing-user-row-anhnd137')).toBeInTheDocument();
    expect(screen.getByTestId('missing-user-row-anhvnt2')).toBeInTheDocument();
  });

  it('displays the user and missing-day totals in the header', () => {
    mockUseMissingWorklogsReport.mockReturnValue({
      ...defaultReportReturn,
      rows: sampleRows,
      hasSearched: true,
    });
    render(<MissingWorklogsPage />);
    expect(screen.getByTestId('header-subtitle')).toHaveTextContent(
      'Project One · 2 users · 4 missing days'
    );
  });

  it('shows the error message in the header', () => {
    mockUseMissingWorklogsReport.mockReturnValue({
      ...defaultReportReturn,
      error: 'Please select a project.',
    });
    render(<MissingWorklogsPage />);
    expect(screen.getByTestId('header-subtitle')).toHaveTextContent(
      'Please select a project.'
    );
  });

  // --- Actions ---

  it('calls handleSearch when Search is clicked', async () => {
    const user = userEvent.setup();
    render(<MissingWorklogsPage />);
    await user.click(screen.getByRole('button', { name: /Search/ }));
    expect(mockHandleSearch).toHaveBeenCalled();
  });

  it('disables Search when no project is selected', () => {
    mockUseMissingWorklogsReport.mockReturnValue({
      ...defaultReportReturn,
      selectedProject: null,
    });
    render(<MissingWorklogsPage />);
    expect(screen.getByRole('button', { name: /Search/ })).toBeDisabled();
  });

  // --- Configuration ---

  it('renders the configuration warning when Jira is not configured', () => {
    mockUseTimesheetSettings.mockReturnValue({
      ...configuredSettings,
      isConfigured: false,
    });
    render(<MissingWorklogsPage />);
    expect(screen.getByTestId('not-configured-alert')).toBeInTheDocument();
  });

  it('renders the token expired alert on an auth error', () => {
    mockUseMissingWorklogsReport.mockReturnValue({
      ...defaultReportReturn,
      authError: true,
    });
    render(<MissingWorklogsPage />);
    expect(screen.getByTestId('token-expired-alert')).toBeInTheDocument();
  });
});
