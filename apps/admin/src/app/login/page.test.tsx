import { redirect } from 'next/navigation';

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { getUserFromSession, hasStaffAccess } from '@/lib/auth';

import LoginPage from './page';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  getUserFromSession: jest.fn(),
  hasStaffAccess: jest.fn(),
}));

const renderPage = async (searchParams: { error?: string } = {}) => {
  render(await LoginPage({ searchParams: Promise.resolve(searchParams) }));
};

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getUserFromSession as jest.Mock).mockResolvedValue(null);
    (hasStaffAccess as jest.Mock).mockReturnValue(false);
  });

  it('renders a sign-in button that starts the hosted login', async () => {
    await renderPage();

    expect(
      screen.getByRole('heading', { name: 'Sign in to Admin' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Continue to sign in' })
    ).toHaveAttribute('href', '/api/auth/login');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not redirect a signed-out visitor', async () => {
    await renderPage();

    expect(redirect).not.toHaveBeenCalled();
  });

  it('redirects a signed-in staff member to the dashboard', async () => {
    (hasStaffAccess as jest.Mock).mockReturnValue(true);

    await renderPage();

    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('displays access denied and signs out first when forbidden', async () => {
    await renderPage({ error: 'forbidden' });

    expect(screen.getByRole('alert')).toHaveTextContent('Access denied');
    expect(
      screen.getByRole('link', { name: 'Sign in with a different account' })
    ).toHaveAttribute('href', '/api/auth/logout');
  });
});
