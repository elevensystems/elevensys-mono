import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

import UrlifyPage from './page';

// --- Mock toast ---

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// --- Mock fetch ---

const mockFetch = jest.fn();
beforeAll(() => {
  global.fetch = mockFetch;
});

// --- Mock hooks ---

const mockTrigger = jest.fn();
const mockIsActive = jest.fn().mockReturnValue(false);
jest.mock('@/hooks/use-action-feedback', () => ({
  useActionFeedback: () => ({
    isActive: mockIsActive,
    trigger: mockTrigger,
  }),
}));

const mockAdd = jest.fn();
const mockRemove = jest.fn();
const mockClearAll = jest.fn();
const mockHistoryItems: unknown[] = [];
jest.mock('@/hooks/use-url-history', () => ({
  useUrlHistory: () => ({
    items: mockHistoryItems,
    add: mockAdd,
    remove: mockRemove,
    clearAll: mockClearAll,
  }),
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
  }: {
    title: string;
    description: string;
  }) => (
    <div data-testid="tool-page-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}));

// --- Mock icons ---

jest.mock('lucide-react', () => ({
  Check: () => <span data-testid="icon-check" />,
  Copy: () => <span data-testid="icon-copy" />,
  CornerDownLeft: () => <span data-testid="icon-corner-down-left" />,
  Link2: () => <span data-testid="icon-link2" />,
  Trash2: () => <span data-testid="icon-trash" />,
}));

// --- Mock UI components ---

jest.mock('@workspace/ui/components/spinner', () => ({
  Spinner: () => <span data-testid="spinner" />,
}));

jest.mock('@workspace/ui/components/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
    variant?: string;
    size?: string;
  }) => <button {...props}>{children}</button>,
}));

jest.mock('@workspace/ui/components/checkbox', () => ({
  Checkbox: ({
    id,
    checked,
    onCheckedChange,
  }: {
    id?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={e => onCheckedChange?.(e.target.checked)}
    />
  ),
}));

jest.mock('@workspace/ui/components/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

jest.mock('@workspace/ui/components/shine-border', () => ({
  ShineBorder: () => <span data-testid="shine-border" />,
}));

jest.mock('@workspace/ui/components/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// --- Tests ---

describe('UrlifyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsActive.mockReturnValue(false);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          shortUrl: 'https://short.url/abc123',
          shortCode: 'abc123',
          originalUrl: 'https://example.com/very/long/url',
          createdAt: '2026-01-01T00:00:00Z',
        }),
    });
  });

  const getUrlInput = () =>
    screen.getByPlaceholderText('Paste a long URL here...');
  const getShortenButton = () =>
    screen.getByRole('button', { name: /^Shorten$/i });

  // --- Page header ---

  it('renders page header with title and description', () => {
    render(<UrlifyPage />);
    expect(screen.getByText('Urlify')).toBeInTheDocument();
    expect(
      screen.getByText('Shorten any URL into a compact, shareable link.')
    ).toBeInTheDocument();
  });

  // --- Input + controls ---

  it('renders URL input with placeholder', () => {
    render(<UrlifyPage />);
    const input = getUrlInput();
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'url');
  });

  it('renders auto-delete checkbox unchecked by default', () => {
    render(<UrlifyPage />);
    const checkbox = screen.getByLabelText('Auto-delete link');
    expect(checkbox).not.toBeChecked();
  });

  it('renders Shorten button', () => {
    render(<UrlifyPage />);
    expect(getShortenButton()).toBeInTheDocument();
  });

  // --- Validation ---

  it('displays error when submitting empty URL', async () => {
    render(<UrlifyPage />);
    await userEvent.click(getShortenButton());
    await waitFor(() => {
      expect(screen.getByText('Please enter a URL.')).toBeInTheDocument();
    });
  });

  it('displays error for invalid URL', async () => {
    render(<UrlifyPage />);
    await userEvent.type(getUrlInput(), 'not-a-url');
    await userEvent.click(getShortenButton());
    await waitFor(() => {
      expect(
        screen.getByText(/must start with http:\/\/ or https:\/\//)
      ).toBeInTheDocument();
    });
  });

  // --- Successful shorten ---

  it('calls fetch with correct parameters on shorten', async () => {
    render(<UrlifyPage />);
    await userEvent.type(getUrlInput(), 'https://example.com/long');
    await userEvent.click(getShortenButton());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/urlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: 'https://example.com/long',
          autoDelete: false,
          ttlDays: undefined,
        }),
      });
    });
  });

  it('sends ttlDays=30 when auto-delete is enabled', async () => {
    render(<UrlifyPage />);
    await userEvent.type(getUrlInput(), 'https://example.com/long');
    await userEvent.click(screen.getByLabelText('Auto-delete link'));
    await userEvent.click(getShortenButton());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/urlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: 'https://example.com/long',
          autoDelete: true,
          ttlDays: 30,
        }),
      });
    });
  });

  it('displays shortened URL result on success', async () => {
    render(<UrlifyPage />);
    await userEvent.type(getUrlInput(), 'https://example.com/long');
    await userEvent.click(getShortenButton());

    await waitFor(() => {
      expect(screen.getByText('https://short.url/abc123')).toBeInTheDocument();
    });
  });

  it('shows success toast on successful shorten', async () => {
    render(<UrlifyPage />);
    await userEvent.type(getUrlInput(), 'https://example.com/long');
    await userEvent.click(getShortenButton());

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('URL shortened successfully');
    });
  });

  it('clears input after successful shorten', async () => {
    render(<UrlifyPage />);
    await userEvent.type(getUrlInput(), 'https://example.com/long');
    await userEvent.click(getShortenButton());

    await waitFor(() => {
      expect(getUrlInput()).toHaveValue('');
    });
  });

  // --- Error handling ---

  it('displays error when API returns non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    render(<UrlifyPage />);
    await userEvent.type(getUrlInput(), 'https://example.com/long');
    await userEvent.click(getShortenButton());

    await waitFor(() => {
      expect(
        screen.getByText('Failed to shorten URL. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('displays error when fetch rejects', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    render(<UrlifyPage />);
    await userEvent.type(getUrlInput(), 'https://example.com/long');
    await userEvent.click(getShortenButton());

    await waitFor(() => {
      expect(
        screen.getByText('Failed to shorten URL. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('displays error when API returns response without shortUrl', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ error: 'something went wrong' }),
    });
    render(<UrlifyPage />);
    await userEvent.type(getUrlInput(), 'https://example.com/long');
    await userEvent.click(getShortenButton());

    await waitFor(() => {
      expect(
        screen.getByText('Failed to shorten URL. Please try again.')
      ).toBeInTheDocument();
    });
  });

  // --- Keyboard interaction ---

  it('triggers shorten on Enter key press', async () => {
    render(<UrlifyPage />);
    await userEvent.type(getUrlInput(), 'https://example.com/long{Enter}');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  // --- URL change clears state ---

  it('clears error when URL input changes', async () => {
    render(<UrlifyPage />);
    await userEvent.click(getShortenButton());

    await waitFor(() => {
      expect(screen.getByText('Please enter a URL.')).toBeInTheDocument();
    });

    await userEvent.type(getUrlInput(), 'h');
    expect(screen.queryByText('Please enter a URL.')).not.toBeInTheDocument();
  });

  // --- Copy functionality ---

  it('copies shortened URL and triggers feedback', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<UrlifyPage />);
    await userEvent.type(getUrlInput(), 'https://example.com/long');
    await userEvent.click(getShortenButton());

    await waitFor(() => {
      expect(screen.getByText('https://short.url/abc123')).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Copy shortened URL' })
    );

    expect(writeText).toHaveBeenCalledWith('https://short.url/abc123');
    expect(mockTrigger).toHaveBeenCalledWith('result');
  });
});
