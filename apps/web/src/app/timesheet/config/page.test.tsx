import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

import TimesheetConfigPage from './page';

// --- Mock hooks ---

const mockSaveSettings = jest.fn();
const mockUseTimesheetSettings = jest.fn();
jest.mock('@/hooks/use-timesheet-settings', () => ({
  useTimesheetSettings: () => mockUseTimesheetSettings(),
}));

// --- Mock toast ---

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// --- Mock fetch ---

const mockFetch = jest.fn();
beforeAll(() => {
  global.fetch = mockFetch;
});

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
    infoMessage,
  }: {
    title: string;
    description: string;
    infoMessage?: string;
  }) => (
    <div data-testid="tool-page-header">
      <h1>{title}</h1>
      <p>{description}</p>
      {infoMessage && <p data-testid="info-message">{infoMessage}</p>}
    </div>
  ),
}));

// --- Mock next/link ---

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

// --- Mock icons ---

jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="icon-arrow-left" />,
  Check: () => <span data-testid="icon-check" />,
  Eye: () => <span data-testid="icon-eye" />,
  EyeOff: () => <span data-testid="icon-eye-off" />,
  KeyRound: () => <span data-testid="icon-key-round" />,
  Save: () => <span data-testid="icon-save" />,
  Server: () => <span data-testid="icon-server" />,
  Settings: () => <span data-testid="icon-settings" />,
  ShieldCheck: () => <span data-testid="icon-shield-check" />,
  Trash2: () => <span data-testid="icon-trash" />,
  User: () => <span data-testid="icon-user" />,
  X: () => <span data-testid="icon-x" />,
}));

jest.mock('@workspace/ui/components/spinner', () => ({
  Spinner: () => <span data-testid="icon-loader" />,
}));

// --- Mock UI components ---

jest.mock('@workspace/ui/components/alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => (
    <div role="alert">{children}</div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

jest.mock('@workspace/ui/components/badge', () => ({
  Badge: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => <span data-variant={variant}>{children}</span>,
}));

jest.mock('@workspace/ui/components/button', () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
    asChild?: boolean;
    variant?: string;
    size?: string;
  }) => {
    if (asChild) return <>{children}</>;
    return <button {...props}>{children}</button>;
  },
}));

jest.mock('@workspace/ui/components/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardAction: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-action">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  CardFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-footer">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
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
  }: React.LabelHTMLAttributes<HTMLLabelElement> & {
    children: React.ReactNode;
  }) => <label {...props}>{children}</label>,
}));

jest.mock('@workspace/ui/components/native-select', () => ({
  NativeSelect: ({
    children,
    ...props
  }: React.SelectHTMLAttributes<HTMLSelectElement> & {
    children: React.ReactNode;
  }) => <select {...props}>{children}</select>,
}));

// --- Test data ---

const emptySettings = {
  settings: { username: '', token: '', jiraInstance: 'jiradc' },
  saveSettings: mockSaveSettings,
  isConfigured: false,
  isLoaded: true,
};

const configuredSettings = {
  settings: {
    username: 'testuser',
    token: 'test-token',
    jiraInstance: 'jiradc',
  },
  saveSettings: mockSaveSettings,
  isConfigured: true,
  isLoaded: true,
};

// --- Tests ---

describe('TimesheetConfigPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTimesheetSettings.mockReturnValue(configuredSettings);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { authentication: 'auth-data' } }),
    });
  });

  // --- Loading state ---

  it('renders loading spinner when settings are not loaded', () => {
    mockUseTimesheetSettings.mockReturnValue({
      ...emptySettings,
      isLoaded: false,
    });
    render(<TimesheetConfigPage />);
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
  });

  it('hides page content when settings are not loaded', () => {
    mockUseTimesheetSettings.mockReturnValue({
      ...emptySettings,
      isLoaded: false,
    });
    render(<TimesheetConfigPage />);
    expect(screen.queryByText('Configurations')).not.toBeInTheDocument();
  });

  // --- Page header ---

  it('renders page header with title and description', () => {
    render(<TimesheetConfigPage />);
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('renders privacy note about local storage', () => {
    render(<TimesheetConfigPage />);
    expect(screen.getByText(/Credentials stored locally/)).toBeInTheDocument();
  });

  // --- Connection status ---

  it('renders "Connected" badge when configured', () => {
    render(<TimesheetConfigPage />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('renders "Not configured" badge when not configured', () => {
    mockUseTimesheetSettings.mockReturnValue(emptySettings);
    render(<TimesheetConfigPage />);
    expect(screen.getByText('Not configured')).toBeInTheDocument();
  });

  // --- Form fields ---

  it('renders Jira Instance select with three options', () => {
    render(<TimesheetConfigPage />);
    const select = screen.getByLabelText('Instance');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'jiradc' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'jira3' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'jira9' })).toBeInTheDocument();
  });

  it('renders Username input with saved value', () => {
    render(<TimesheetConfigPage />);
    expect(screen.getByLabelText('Username')).toHaveValue('testuser');
  });

  it('renders Token input as password type by default', () => {
    render(<TimesheetConfigPage />);
    expect(screen.getByLabelText('Token')).toHaveAttribute('type', 'password');
  });

  it('renders help link with correct jiraInstance URL', () => {
    render(<TimesheetConfigPage />);
    const link = screen.getByText('Create a token');
    expect(link).toHaveAttribute(
      'href',
      'https://insight.fsoft.com.vn/jiradc/secure/ViewProfile.jspa'
    );
  });

  // --- Token visibility toggle ---

  it('toggles token to visible when show button is clicked', async () => {
    render(<TimesheetConfigPage />);
    const toggle = screen.getByRole('button', { name: 'Show token' });
    await userEvent.click(toggle);
    expect(screen.getByLabelText('Token')).toHaveAttribute('type', 'text');
  });

  it('toggles token back to hidden on second click', async () => {
    render(<TimesheetConfigPage />);
    const toggle = screen.getByRole('button', { name: 'Show token' });
    await userEvent.click(toggle);
    await userEvent.click(screen.getByRole('button', { name: 'Hide token' }));
    expect(screen.getByLabelText('Token')).toHaveAttribute('type', 'password');
  });

  // --- Navigation links ---

  it('renders navigation links when configured', () => {
    render(<TimesheetConfigPage />);
    expect(screen.getByText('Log Work').closest('a')).toHaveAttribute(
      'href',
      '/timesheet/logwork'
    );
    expect(screen.getByText('My Worklogs').closest('a')).toHaveAttribute(
      'href',
      '/timesheet/my-worklogs'
    );
  });

  it('hides navigation links when not configured', () => {
    mockUseTimesheetSettings.mockReturnValue(emptySettings);
    render(<TimesheetConfigPage />);
    expect(screen.queryByText('Log Work')).not.toBeInTheDocument();
    expect(screen.queryByText('My Worklogs')).not.toBeInTheDocument();
  });

  // --- Clear button ---

  it('disables Clear button when not configured', () => {
    mockUseTimesheetSettings.mockReturnValue(emptySettings);
    render(<TimesheetConfigPage />);
    expect(screen.getByRole('button', { name: /Clear/i })).toBeDisabled();
  });

  it('enables Clear button when configured', () => {
    render(<TimesheetConfigPage />);
    expect(screen.getByRole('button', { name: /Clear/i })).not.toBeDisabled();
  });

  it('clears form and saves empty settings on Clear click', async () => {
    render(<TimesheetConfigPage />);
    await userEvent.click(screen.getByRole('button', { name: /Clear/i }));
    expect(mockSaveSettings).toHaveBeenCalledWith({
      username: '',
      token: '',
      jiraInstance: 'jiradc',
    });
    expect(toast.success).toHaveBeenCalledWith('Settings cleared');
  });

  // --- Save button states ---

  it('renders "Saved" text when configured with no changes', () => {
    render(<TimesheetConfigPage />);
    expect(screen.getByRole('button', { name: /Saved/i })).toBeInTheDocument();
  });

  it('disables save button when configured with no changes', () => {
    render(<TimesheetConfigPage />);
    expect(screen.getByRole('button', { name: /Saved/i })).toBeDisabled();
  });

  it('renders "Save" text when not configured', () => {
    mockUseTimesheetSettings.mockReturnValue(emptySettings);
    render(<TimesheetConfigPage />);
    expect(screen.getByRole('button', { name: /Save$/i })).toBeInTheDocument();
  });

  it('enables save button when form has unsaved changes', async () => {
    render(<TimesheetConfigPage />);
    await userEvent.clear(screen.getByLabelText('Username'));
    await userEvent.type(screen.getByLabelText('Username'), 'newuser');
    expect(screen.getByRole('button', { name: /Save$/i })).not.toBeDisabled();
  });

  // --- Save validation ---

  it('shows error toast when saving with empty username', async () => {
    mockUseTimesheetSettings.mockReturnValue(emptySettings);
    render(<TimesheetConfigPage />);
    await userEvent.click(screen.getByRole('button', { name: /Save$/i }));
    expect(toast.error).toHaveBeenCalledWith('Username is required');
  });

  it('shows error toast when saving with empty token', async () => {
    mockUseTimesheetSettings.mockReturnValue(emptySettings);
    render(<TimesheetConfigPage />);
    await userEvent.type(screen.getByLabelText('Username'), 'testuser');
    await userEvent.click(screen.getByRole('button', { name: /Save$/i }));
    expect(toast.error).toHaveBeenCalledWith('Token is required');
  });

  // --- Save API flow ---

  it('calls auth API with correct parameters on save', async () => {
    mockUseTimesheetSettings.mockReturnValue(emptySettings);
    render(<TimesheetConfigPage />);
    await userEvent.type(screen.getByLabelText('Username'), 'newuser');
    await userEvent.type(screen.getByLabelText('Token'), 'new-token');
    await userEvent.click(screen.getByRole('button', { name: /Save$/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/timesheet/auth?jiraInstance=jiradc',
        {
          headers: {
            Authorization: 'Bearer new-token',
          },
        }
      );
    });
  });

  it('saves settings on successful auth response', async () => {
    mockUseTimesheetSettings.mockReturnValue(emptySettings);
    render(<TimesheetConfigPage />);
    await userEvent.type(screen.getByLabelText('Username'), 'newuser');
    await userEvent.type(screen.getByLabelText('Token'), 'new-token');
    await userEvent.click(screen.getByRole('button', { name: /Save$/i }));

    await waitFor(() => {
      expect(mockSaveSettings).toHaveBeenCalledWith({
        username: 'newuser',
        token: 'new-token',
        jiraInstance: 'jiradc',
        authData: { authentication: 'auth-data' },
      });
    });
  });

  it('shows success toast on successful save', async () => {
    mockUseTimesheetSettings.mockReturnValue(emptySettings);
    render(<TimesheetConfigPage />);
    await userEvent.type(screen.getByLabelText('Username'), 'newuser');
    await userEvent.type(screen.getByLabelText('Token'), 'new-token');
    await userEvent.click(screen.getByRole('button', { name: /Save$/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Settings saved successfully');
    });
  });

  it('shows error toast on failed auth response', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    mockUseTimesheetSettings.mockReturnValue(emptySettings);
    render(<TimesheetConfigPage />);
    await userEvent.type(screen.getByLabelText('Username'), 'newuser');
    await userEvent.type(screen.getByLabelText('Token'), 'bad-token');
    await userEvent.click(screen.getByRole('button', { name: /Save$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Token is not valid or not correct'
      );
    });
  });

  it('shows error toast when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    mockUseTimesheetSettings.mockReturnValue(emptySettings);
    render(<TimesheetConfigPage />);
    await userEvent.type(screen.getByLabelText('Username'), 'newuser');
    await userEvent.type(screen.getByLabelText('Token'), 'some-token');
    await userEvent.click(screen.getByRole('button', { name: /Save$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Token is not valid or not correct'
      );
    });
  });

  // --- Form interactions ---

  it('updates help link URL when jira instance changes', async () => {
    render(<TimesheetConfigPage />);
    await userEvent.selectOptions(
      screen.getByLabelText('Instance'),
      'jira3'
    );
    expect(screen.getByText('Create a token')).toHaveAttribute(
      'href',
      'https://insight.fsoft.com.vn/jira3/secure/ViewProfile.jspa'
    );
  });
});
