import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CaseifyPage from './page';

// --- Mock clipboard ---

Object.assign(navigator, {
  clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
});

const mockTrigger = jest.fn();
const mockIsActive = jest.fn().mockReturnValue(false);
const mockUseActionFeedback = jest.fn();
jest.mock('@/hooks/use-action-feedback', () => ({
  useActionFeedback: () => mockUseActionFeedback(),
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
  CaseSensitive: () => <span data-testid="icon-case-sensitive" />,
  Check: () => <span data-testid="icon-check" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  Copy: () => <span data-testid="icon-copy" />,
  Eraser: () => <span data-testid="icon-eraser" />,
}));

// --- Mock UI components ---

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

jest.mock('@workspace/ui/components/card', () => ({
  Card: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({
    children,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({
    children,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <h2>{children}</h2>,
}));

jest.mock('@workspace/ui/components/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
}));

jest.mock('@workspace/ui/components/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({
    children,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

jest.mock('@workspace/ui/components/collapsible', () => ({
  Collapsible: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => <div data-testid="collapsible">{open !== false && children}</div>,
  CollapsibleTrigger: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
  }) => <button {...props}>{children}</button>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// --- Tests ---

describe('CaseifyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsActive.mockReturnValue(false);
    mockUseActionFeedback.mockReturnValue({
      isActive: mockIsActive,
      trigger: mockTrigger,
    });
  });

  // --- Page header ---

  it('renders page header with correct title', () => {
    render(<CaseifyPage />);
    expect(screen.getByText('Caseify')).toBeInTheDocument();
  });

  it('renders page description', () => {
    render(<CaseifyPage />);
    expect(
      screen.getByText(
        'Transform your text between common casing styles and delimiters in one click.'
      )
    ).toBeInTheDocument();
  });

  // --- Input area ---

  it('renders textarea with placeholder', () => {
    render(<CaseifyPage />);
    expect(
      screen.getByPlaceholderText('Type or paste your text here...')
    ).toBeInTheDocument();
  });

  it('disables clear button when input is empty', () => {
    render(<CaseifyPage />);
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  });

  it('enables clear button when input has text', async () => {
    render(<CaseifyPage />);
    await userEvent.type(
      screen.getByPlaceholderText('Type or paste your text here...'),
      'hello'
    );
    expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled();
  });

  it('clears input when clear button is clicked', async () => {
    render(<CaseifyPage />);
    const textarea = screen.getByPlaceholderText(
      'Type or paste your text here...'
    );
    await userEvent.type(textarea, 'hello');
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(textarea).toHaveValue('');
  });

  // --- Empty state ---

  it('shows empty state message when no input', () => {
    render(<CaseifyPage />);
    expect(
      screen.getByText('Start typing to see conversions')
    ).toBeInTheDocument();
  });

  it('hides empty state when input is provided', async () => {
    render(<CaseifyPage />);
    await userEvent.type(
      screen.getByPlaceholderText('Type or paste your text here...'),
      'hello'
    );
    expect(
      screen.queryByText('Start typing to see conversions')
    ).not.toBeInTheDocument();
  });

  // --- Section headers ---

  it('renders both section headers when input is provided', async () => {
    render(<CaseifyPage />);
    await userEvent.type(
      screen.getByPlaceholderText('Type or paste your text here...'),
      'hello world'
    );
    expect(screen.getByText('Common Text Cases')).toBeInTheDocument();
    expect(screen.getByText('Programming / Code Cases')).toBeInTheDocument();
  });

  // --- Conversion results ---

  it('displays correct lowercase conversion', async () => {
    render(<CaseifyPage />);
    await userEvent.type(
      screen.getByPlaceholderText('Type or paste your text here...'),
      'Hello World'
    );
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('displays correct camelCase conversion', async () => {
    render(<CaseifyPage />);
    await userEvent.type(
      screen.getByPlaceholderText('Type or paste your text here...'),
      'hello world'
    );
    expect(screen.getByText('helloWorld')).toBeInTheDocument();
  });

  it('displays correct snake_case conversion', async () => {
    render(<CaseifyPage />);
    await userEvent.type(
      screen.getByPlaceholderText('Type or paste your text here...'),
      'hello world'
    );
    expect(screen.getByText('hello_world')).toBeInTheDocument();
  });

  it('shows aliases as subtitle', async () => {
    render(<CaseifyPage />);
    await userEvent.type(
      screen.getByPlaceholderText('Type or paste your text here...'),
      'hello world'
    );
    expect(screen.getByText('also: MACRO_CASE')).toBeInTheDocument();
  });

  // --- Copy functionality ---

  it('calls copy when clicking a result row', async () => {
    render(<CaseifyPage />);
    await userEvent.type(
      screen.getByPlaceholderText('Type or paste your text here...'),
      'hello world'
    );

    // Each result row is a button — first "Copy to clipboard" is lowercase
    const copyButtons = screen.getAllByRole('button', {
      name: 'Copy to clipboard',
    });
    await userEvent.click(copyButtons[0]);
    expect(mockTrigger).toHaveBeenCalledWith('lowercase');
  });

  it('shows check icon when feedback is active', async () => {
    mockIsActive.mockImplementation((id: string) => id === 'lowercase');
    mockUseActionFeedback.mockReturnValue({
      isActive: mockIsActive,
      trigger: mockTrigger,
    });
    render(<CaseifyPage />);
    await userEvent.type(
      screen.getByPlaceholderText('Type or paste your text here...'),
      'hello world'
    );

    expect(
      screen.getByRole('button', { name: 'Copied to clipboard' })
    ).toBeInTheDocument();
  });
});
