import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { ThemeProvider } from './theme-provider';

jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="next-themes-provider">{children}</div>
  ),
}));

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(
      <ThemeProvider>
        <span>content</span>
      </ThemeProvider>
    );

    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('wraps children in the next-themes provider', () => {
    render(
      <ThemeProvider>
        <span>content</span>
      </ThemeProvider>
    );

    expect(screen.getByTestId('next-themes-provider')).toBeInTheDocument();
  });

  it('passes props through to the underlying provider', () => {
    const { container } = render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <span>content</span>
      </ThemeProvider>
    );

    expect(container).toBeInTheDocument();
  });
});
