import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import AdminPage from './page';

describe('AdminPage', () => {
  beforeEach(() => {
    render(<AdminPage />);
  });

  // --- Heading ---

  it('renders the main heading', () => {
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Elevensys Admin');
  });
});
