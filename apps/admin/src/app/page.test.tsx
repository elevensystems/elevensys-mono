import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { getUserFromSession } from '@/lib/auth';

import AdminPage from './page';

// Mock dependencies
jest.mock('@/components/layouts/main-layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/lib/auth', () => ({
  getUserFromSession: jest.fn(),
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

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome, John Doe');
  });

  it('renders the welcome message for unauthenticated user', async () => {
    (getUserFromSession as jest.Mock).mockResolvedValue(null);

    const component = await AdminPage();
    render(component);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome');
  });

  it('renders the Urlify card', async () => {
    (getUserFromSession as jest.Mock).mockResolvedValue(null);

    const component = await AdminPage();
    render(component);

    expect(screen.getByText('Urlify')).toBeInTheDocument();
    expect(screen.getByText(/Manage shortened URLs/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open Urlify/i })).toHaveAttribute(
      'href',
      '/urlify'
    );
  });
});
