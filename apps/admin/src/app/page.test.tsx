import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { getUserFromSession } from '@/lib/auth';

import AdminPage from './page';

// Mock dependencies
jest.mock('@/components/layouts/main-layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('@/lib/auth', () => ({
  getUserFromSession: jest.fn(),
}));

jest.mock('@/lib/global-config-admin', () => ({
  readBannerConfig: () => ({ all: [{ message: 'a' }, { message: 'b' }] }),
}));

jest.mock('@/lib/global-config-client', () => ({
  isGlobalConfigConfigured: () => true,
  readItems: jest
    .fn()
    .mockResolvedValue({ 'sidebar-tools': ['/tools/passly'] }),
  readAudit: () => [],
}));

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the welcome message for authenticated user', async () => {
    (getUserFromSession as jest.Mock).mockResolvedValue({
      name: 'John Doe',
      email: 'john@example.com',
    });

    // Handle async Server Component
    const component = await AdminPage();
    render(component);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Welcome, John Doe'
    );
  });

  it('renders the welcome message for unauthenticated user', async () => {
    (getUserFromSession as jest.Mock).mockResolvedValue(null);

    const component = await AdminPage();
    render(component);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Welcome'
    );
  });

  it('renders a link card for every section', async () => {
    (getUserFromSession as jest.Mock).mockResolvedValue(null);

    const component = await AdminPage();
    render(component);

    expect(screen.getByRole('link', { name: /Urlify/ })).toHaveAttribute(
      'href',
      '/urlify'
    );
    expect(screen.getByText(/Manage shortened URLs/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Site Banner/ })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Audit/ })).toBeInTheDocument();
  });

  it('displays live config status', async () => {
    (getUserFromSession as jest.Mock).mockResolvedValue(null);

    const component = await AdminPage();
    render(component);

    expect(screen.getByText('2 banners live or scheduled')).toBeInTheDocument();
    expect(screen.getByText(/^1 of \d+ tools visible$/)).toBeInTheDocument();
    expect(screen.getByText('No changes recorded yet.')).toBeInTheDocument();
  });
});
