import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { MyWorklogsRow } from '@/types/timesheet';

import WorklogManagementPage from './page';

// --- Mock hooks ---

const mockUseTimesheetSettings = jest.fn();
jest.mock('@/hooks/use-timesheet-settings', () => ({
  useTimesheetSettings: () => mockUseTimesheetSettings(),
}));

const mockHandleSearch = jest.fn();
const mockGoToPage = jest.fn();
const mockToggleSelectAll = jest.fn();
const mockToggleSelect = jest.fn();
const mockClearSelection = jest.fn();
const mockHandleDelete = jest.fn();
const mockHandleBulkDelete = jest.fn();
const mockSetFromDate = jest.fn();
const mockSetToDate = jest.fn();
const mockSetSelectedProject = jest.fn();
const mockSetStatusWorklog = jest.fn();

const mockUseWorklogs = jest.fn();
jest.mock('@/hooks/use-worklogs', () => ({
  useWorklogs: () => mockUseWorklogs(),
  getWorklogKey: (w: MyWorklogsRow) => `${w.id}_${w.issueId}`,
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
    description,
    error,
  }: {
    title: string;
    description: string;
    error?: string;
  }) => (
    <div data-testid="tool-page-header">
      <h1>{title}</h1>
      <p>{description}</p>
      {error && <div data-testid="header-error">{error}</div>}
    </div>
  ),
}));

// --- Mock child components ---

jest.mock('./_components/worklog-row', () => ({
  WorklogRow: ({ worklog }: { worklog: MyWorklogsRow }) => (
    <tr data-testid={`worklog-row-${worklog.id}`}>
      <td>{worklog.issueKey}</td>
    </tr>
  ),
}));

jest.mock('./_components/bulk-delete-action', () => ({
  BulkDeleteAction: ({
    selectedCount,
    onBulkDelete,
    onClearSelection,
  }: {
    selectedCount: number;
    onBulkDelete: () => void;
    onClearSelection: () => void;
  }) => (
    <div data-testid="bulk-delete-action">
      <span>{selectedCount} selected</span>
      <button onClick={onBulkDelete}>Bulk Delete</button>
      <button onClick={onClearSelection}>Clear Selection</button>
    </div>
  ),
}));

// --- Mock UI components ---

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid="icon-alert-circle" />,
  ClipboardList: () => <span data-testid="icon-clipboard-list" />,
  Search: () => <span data-testid="icon-search" />,
}));

jest.mock('@workspace/ui/components/spinner', () => ({
  Spinner: () => <span data-testid="icon-loader" />,
}));

jest.mock('@workspace/ui/components/alert', () => ({
  Alert: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div role="alert" {...props}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

jest.mock('@workspace/ui/components/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
  }) => <button {...props}>{children}</button>,
}));

jest.mock('@workspace/ui/components/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="card-description">{children}</p>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

jest.mock('@workspace/ui/components/checkbox', () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    ...props
  }: {
    checked: boolean | 'indeterminate';
    onCheckedChange: (val: boolean) => void;
    'aria-label'?: string;
  }) => (
    <input
      type="checkbox"
      checked={checked === true}
      onChange={() => onCheckedChange?.(!checked)}
      {...props}
    />
  ),
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
        onClick={() => onRangeChange?.('2025-02-01', '2025-02-28')}
      />
    </div>
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

jest.mock('@workspace/ui/components/native-select', () => ({
  NativeSelect: ({
    children,
    onChange,
    ...props
  }: React.SelectHTMLAttributes<HTMLSelectElement> & {
    children: React.ReactNode;
  }) => (
    <select onChange={onChange} {...props}>
      {children}
    </select>
  ),
}));

jest.mock('@workspace/ui/components/pagination', () => ({
  Pagination: ({ children }: { children: React.ReactNode }) => (
    <nav data-testid="pagination">{children}</nav>
  ),
  PaginationContent: ({ children }: { children: React.ReactNode }) => (
    <ul>{children}</ul>
  ),
  PaginationEllipsis: () => <span>...</span>,
  PaginationItem: ({ children }: { children: React.ReactNode }) => (
    <li>{children}</li>
  ),
  PaginationLink: ({
    children,
    isActive,
    onClick,
  }: {
    children: React.ReactNode;
    isActive?: boolean;
    onClick?: () => void;
  }) => (
    <button data-active={isActive} onClick={onClick}>
      {children}
    </button>
  ),
  PaginationNext: ({
    onClick,
    ...props
  }: {
    onClick?: () => void;
    'aria-disabled'?: boolean;
    className?: string;
  }) => (
    <button data-testid="pagination-next" onClick={onClick} {...props}>
      Next
    </button>
  ),
  PaginationPrevious: ({
    onClick,
    ...props
  }: {
    onClick?: () => void;
    'aria-disabled'?: boolean;
    className?: string;
  }) => (
    <button data-testid="pagination-prev" onClick={onClick} {...props}>
      Previous
    </button>
  ),
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
  TableHeader: ({
    children,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <thead>{children}</thead>,
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

const defaultWorklogsReturn = {
  projects: [
    { id: '1', key: 'PROJ', name: 'Project One' },
    { id: '2', key: 'PROJ2', name: 'Project Two' },
  ],
  projectsLoading: false,
  selectedProject: { id: '1', key: 'PROJ', name: 'Project One' },
  setSelectedProject: mockSetSelectedProject,
  statusWorklog: 'All',
  setStatusWorklog: mockSetStatusWorklog,
  fromDate: '2025-01-01',
  setFromDate: mockSetFromDate,
  toDate: '2025-01-31',
  setToDate: mockSetToDate,
  worklogs: [] as MyWorklogsRow[],
  isLoading: false,
  deletingId: null,
  error: '',
  hasSearched: false,
  totalHours: 0,
  currentPage: 1,
  totalPages: 0,
  totalRecords: 0,
  pageStart: 0,
  pageEnd: 0,
  selectedIds: new Set<string>(),
  allSelected: false,
  someSelected: false,
  isBulkDeleting: false,
  bulkDeleteProgress: 0,
  toggleSelectAll: mockToggleSelectAll,
  toggleSelect: mockToggleSelect,
  clearSelection: mockClearSelection,
  handleSearch: mockHandleSearch,
  goToPage: mockGoToPage,
  handleDelete: mockHandleDelete,
  handleBulkDelete: mockHandleBulkDelete,
};

const sampleWorklogs: MyWorklogsRow[] = [
  {
    id: 1,
    typeIssueName: 'Sub-task',
    issueKey: 'PROJ-101',
    issueId: 100,
    summary: 'Fix bug',
    statusName: 'To Do',
    statusIssue: '/',
    startDate: 'Wed 15/Jan/25',
    startDateEdit: '15/Jan/25',
    description: 'Fixed a bug',
    author: 'testuser',
    typeOfWork: 'Create',
    estimated: '8.00',
    remain: '5.00',
    worked: '2.50',
    statusWorklog: 'Pending',
    isDayOff: false,
    isEdit: true,
    avatarId: '10316',
  },
  {
    id: 2,
    typeIssueName: 'Sub-task',
    issueKey: 'PROJ-102',
    issueId: 200,
    summary: 'Add feature',
    statusName: 'To Do',
    statusIssue: '/',
    startDate: 'Thu 16/Jan/25',
    startDateEdit: '16/Jan/25',
    description: 'Added feature',
    author: 'testuser',
    typeOfWork: 'Review',
    estimated: '8.00',
    remain: '3.00',
    worked: '4.00',
    statusWorklog: 'Approved',
    isDayOff: false,
    isEdit: true,
    avatarId: '10316',
  },
];

// --- Tests ---

describe('WorklogManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTimesheetSettings.mockReturnValue(configuredSettings);
    mockUseWorklogs.mockReturnValue(defaultWorklogsReturn);
  });

  // --- Loading state ---

  it('renders loading spinner when settings are not loaded', () => {
    mockUseTimesheetSettings.mockReturnValue({
      ...configuredSettings,
      isLoaded: false,
    });
    render(<WorklogManagementPage />);
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
  });

  it('hides page content when settings are not loaded', () => {
    mockUseTimesheetSettings.mockReturnValue({
      ...configuredSettings,
      isLoaded: false,
    });
    render(<WorklogManagementPage />);
    expect(screen.queryByText('Worklog Management')).not.toBeInTheDocument();
  });

  // --- Page header ---

  it('renders page header with title and description', () => {
    render(<WorklogManagementPage />);
    expect(screen.getByText('Worklog Management')).toBeInTheDocument();
    expect(
      screen.getByText(/Search and manage logged timesheets from Jira/)
    ).toBeInTheDocument();
  });

  it('passes error to ToolPageHeader', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      error: 'Something went wrong',
    });
    render(<WorklogManagementPage />);
    expect(screen.getByTestId('header-error')).toHaveTextContent(
      'Something went wrong'
    );
  });

  // --- Configuration warning ---

  it('renders configuration warning when Jira is not configured', () => {
    mockUseTimesheetSettings.mockReturnValue({
      ...configuredSettings,
      isConfigured: false,
    });
    render(<WorklogManagementPage />);
    expect(
      screen.getByText(/Jira settings not configured/)
    ).toBeInTheDocument();
  });

  it('renders link to config page in configuration warning', () => {
    mockUseTimesheetSettings.mockReturnValue({
      ...configuredSettings,
      isConfigured: false,
    });
    render(<WorklogManagementPage />);
    const link = screen.getByText('Go to Configs');
    expect(link.closest('a')).toHaveAttribute('href', '/timesheet/config');
  });

  it('hides configuration warning when Jira is configured', () => {
    render(<WorklogManagementPage />);
    expect(
      screen.queryByText(/Jira settings not configured/)
    ).not.toBeInTheDocument();
  });

  // --- Search card ---

  it('renders search card with title and date range picker', () => {
    render(<WorklogManagementPage />);
    expect(screen.getByText('Search Worklogs')).toBeInTheDocument();
    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
  });

  it('renders project select with options', () => {
    render(<WorklogManagementPage />);
    const projectSelect = screen.getByLabelText(/Project/);
    expect(projectSelect).toBeInTheDocument();
    expect(screen.getByText('Project One (PROJ)')).toBeInTheDocument();
    expect(screen.getByText('Project Two (PROJ2)')).toBeInTheDocument();
  });

  it('renders status select with options', () => {
    render(<WorklogManagementPage />);
    const statusSelect = screen.getByLabelText('Status');
    expect(statusSelect).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Approved' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Rejected' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Reopened' })
    ).toBeInTheDocument();
  });

  it('renders search button', () => {
    render(<WorklogManagementPage />);
    expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
  });

  it('disables search button when not configured', () => {
    mockUseTimesheetSettings.mockReturnValue({
      ...configuredSettings,
      isConfigured: false,
    });
    render(<WorklogManagementPage />);
    expect(screen.getByRole('button', { name: /Search/i })).toBeDisabled();
  });

  it('disables search button when no project selected', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      selectedProject: null,
    });
    render(<WorklogManagementPage />);
    expect(screen.getByRole('button', { name: /Search/i })).toBeDisabled();
  });

  it('disables search button while loading', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      isLoading: true,
    });
    render(<WorklogManagementPage />);
    expect(screen.getByRole('button', { name: /Searching/i })).toBeDisabled();
  });

  it('renders "Searching..." text while loading', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      isLoading: true,
    });
    render(<WorklogManagementPage />);
    expect(
      screen.getByText(content => content.includes('Searching'))
    ).toBeInTheDocument();
  });

  it('calls handleSearch when search button is clicked', async () => {
    render(<WorklogManagementPage />);
    await userEvent.click(screen.getByRole('button', { name: /Search/i }));
    expect(mockHandleSearch).toHaveBeenCalledTimes(1);
  });

  it('calls setFromDate and setToDate when date range changes', async () => {
    render(<WorklogManagementPage />);
    await userEvent.click(screen.getByTestId('change-date-range'));
    expect(mockSetFromDate).toHaveBeenCalledWith('2025-02-01');
    expect(mockSetToDate).toHaveBeenCalledWith('2025-02-28');
  });

  // --- Empty states ---

  it('renders initial prompt before search', () => {
    render(<WorklogManagementPage />);
    expect(
      screen.getByText(/Select a project and date range/)
    ).toBeInTheDocument();
  });

  it('renders "no worklogs found" message after empty search', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      hasSearched: true,
    });
    render(<WorklogManagementPage />);
    expect(
      screen.getByText(/No worklogs found for the selected filters/)
    ).toBeInTheDocument();
  });

  it('hides worklogs table when no entries exist', () => {
    render(<WorklogManagementPage />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('hides results description when worklogs are empty', () => {
    render(<WorklogManagementPage />);
    const descriptions = screen.getAllByTestId('card-description');
    const resultsDescription = descriptions.find(el =>
      el.textContent?.includes('records')
    );
    expect(resultsDescription).toBeUndefined();
  });

  it('hides BulkDeleteAction when worklogs are empty', () => {
    render(<WorklogManagementPage />);
    expect(screen.queryByTestId('bulk-delete-action')).not.toBeInTheDocument();
  });

  // --- Loading skeleton ---

  it('renders skeleton loading rows while loading', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      isLoading: true,
    });
    render(<WorklogManagementPage />);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  // --- Worklogs table ---

  it('renders worklogs table when entries exist', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      hasSearched: true,
      totalRecords: 2,
      currentPage: 1,
      totalPages: 1,
      pageStart: 1,
      pageEnd: 2,
    });
    render(<WorklogManagementPage />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays record count and total hours', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      hasSearched: true,
      totalRecords: 2,
      currentPage: 1,
      totalPages: 1,
      pageStart: 1,
      pageEnd: 2,
    });
    render(<WorklogManagementPage />);
    const descriptions = screen.getAllByTestId('card-description');
    const resultsDescription = descriptions.find(el =>
      el.textContent?.includes('records')
    );
    expect(resultsDescription).toHaveTextContent('2 records');
    expect(resultsDescription).toHaveTextContent('6.5 total hours');
  });

  it('renders a WorklogRow for each worklog entry', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      hasSearched: true,
      totalRecords: 2,
      currentPage: 1,
      totalPages: 1,
      pageStart: 1,
      pageEnd: 2,
    });
    render(<WorklogManagementPage />);
    expect(screen.getByTestId('worklog-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('worklog-row-2')).toBeInTheDocument();
  });

  it('renders table column headers', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      hasSearched: true,
      totalRecords: 2,
      currentPage: 1,
      totalPages: 1,
      pageStart: 1,
      pageEnd: 2,
    });
    render(<WorklogManagementPage />);
    expect(screen.getByText('Key')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  // --- Select all checkbox ---

  it('renders select-all checkbox in table header', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      hasSearched: true,
      totalRecords: 2,
      currentPage: 1,
      totalPages: 1,
      pageStart: 1,
      pageEnd: 2,
    });
    render(<WorklogManagementPage />);
    expect(
      screen.getByRole('checkbox', { name: 'Select all' })
    ).toBeInTheDocument();
  });

  it('checks select-all checkbox when all are selected', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      allSelected: true,
      hasSearched: true,
      totalRecords: 2,
      currentPage: 1,
      totalPages: 1,
      pageStart: 1,
      pageEnd: 2,
    });
    render(<WorklogManagementPage />);
    expect(screen.getByRole('checkbox', { name: 'Select all' })).toBeChecked();
  });

  it('unchecks select-all checkbox when none are selected', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      allSelected: false,
      someSelected: false,
      hasSearched: true,
      totalRecords: 2,
      currentPage: 1,
      totalPages: 1,
      pageStart: 1,
      pageEnd: 2,
    });
    render(<WorklogManagementPage />);
    expect(
      screen.getByRole('checkbox', { name: 'Select all' })
    ).not.toBeChecked();
  });

  it('calls toggleSelectAll when select-all checkbox is clicked', async () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      hasSearched: true,
      totalRecords: 2,
      currentPage: 1,
      totalPages: 1,
      pageStart: 1,
      pageEnd: 2,
    });
    render(<WorklogManagementPage />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
    expect(mockToggleSelectAll).toHaveBeenCalledTimes(1);
  });

  // --- Bulk delete ---

  it('renders BulkDeleteAction when worklogs exist', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      hasSearched: true,
      totalRecords: 2,
      currentPage: 1,
      totalPages: 1,
      pageStart: 1,
      pageEnd: 2,
    });
    render(<WorklogManagementPage />);
    expect(screen.getByTestId('bulk-delete-action')).toBeInTheDocument();
  });

  it('passes selected count to BulkDeleteAction', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      selectedIds: new Set(['1_100', '2_200']),
      hasSearched: true,
      totalRecords: 2,
      currentPage: 1,
      totalPages: 1,
      pageStart: 1,
      pageEnd: 2,
    });
    render(<WorklogManagementPage />);
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('calls handleBulkDelete from BulkDeleteAction', async () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      selectedIds: new Set(['1_100']),
      hasSearched: true,
      totalRecords: 2,
      currentPage: 1,
      totalPages: 1,
      pageStart: 1,
      pageEnd: 2,
    });
    render(<WorklogManagementPage />);
    await userEvent.click(screen.getByText('Bulk Delete'));
    expect(mockHandleBulkDelete).toHaveBeenCalledTimes(1);
  });

  it('calls clearSelection from BulkDeleteAction', async () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      selectedIds: new Set(['1_100']),
      hasSearched: true,
      totalRecords: 2,
      currentPage: 1,
      totalPages: 1,
      pageStart: 1,
      pageEnd: 2,
    });
    render(<WorklogManagementPage />);
    await userEvent.click(screen.getByText('Clear Selection'));
    expect(mockClearSelection).toHaveBeenCalledTimes(1);
  });

  // --- Pagination ---

  it('renders pagination when multiple pages exist', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      hasSearched: true,
      totalRecords: 40,
      currentPage: 1,
      totalPages: 2,
      pageStart: 1,
      pageEnd: 20,
    });
    render(<WorklogManagementPage />);
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('hides pagination when only one page', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      hasSearched: true,
      totalRecords: 2,
      currentPage: 1,
      totalPages: 1,
      pageStart: 1,
      pageEnd: 2,
    });
    render(<WorklogManagementPage />);
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });

  it('calls goToPage when next button is clicked', async () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      hasSearched: true,
      totalRecords: 40,
      currentPage: 1,
      totalPages: 2,
      pageStart: 1,
      pageEnd: 20,
    });
    render(<WorklogManagementPage />);
    await userEvent.click(screen.getByTestId('pagination-next'));
    expect(mockGoToPage).toHaveBeenCalledWith(2);
  });
});
