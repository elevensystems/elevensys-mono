import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SiteBannerForm } from '@/app/flags/site-banner/_components/site-banner-form';
import type { SiteBannerSnapshot } from '@/types/site-banner';

const refresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: (...args: unknown[]) => refresh(...args) }),
}));

const toastSuccess = jest.fn();
const toastError = jest.fn();
jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

const PULSE_BANNER = JSON.stringify({
  state: 'warning',
  title: 'Jira DC is unstable',
  message: 'The "Find Dates" feature may not work.',
});

function makeSnapshot(
  overrides: Partial<SiteBannerSnapshot['values']> = {}
): SiteBannerSnapshot {
  return {
    values: {
      all: '',
      web: '',
      admin: '',
      insight: '',
      pulse: '',
      ...overrides,
    },
    history: [],
    configured: true,
  };
}

function mockSave(snapshot: SiteBannerSnapshot) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => snapshot,
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

/** Body of the last POST to the banner endpoint. */
function lastPayload(fetchMock: jest.Mock) {
  const [, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return JSON.parse(String(init.body)) as { target: string; value: string };
}

/** Finds text inside the rendered preview banner, not the textarea. */
function findInPreview(text: string) {
  return screen.findByText(
    (_, element) =>
      element?.getAttribute('data-slot') === 'banner-title' &&
      element.textContent === text
  );
}

describe('SiteBannerForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Loading existing values ---
  it('starts on the global announcement', () => {
    render(<SiteBannerForm snapshot={makeSnapshot()} />);

    expect(screen.getByLabelText('Show on')).toHaveValue('all');
    expect(screen.getByLabelText('Message')).toHaveValue('');
  });

  it('loads the saved announcement for a target when switching to it', async () => {
    const user = userEvent.setup();
    render(<SiteBannerForm snapshot={makeSnapshot({ pulse: PULSE_BANNER })} />);

    await user.selectOptions(screen.getByLabelText('Show on'), 'pulse');

    expect(screen.getByLabelText('Message')).toHaveValue(
      'The "Find Dates" feature may not work.'
    );
    expect(screen.getByLabelText(/^Title/)).toHaveValue('Jira DC is unstable');
    expect(screen.getByLabelText('Style')).toHaveValue('warning');
  });

  it('marks which targets already have a live banner', () => {
    render(<SiteBannerForm snapshot={makeSnapshot({ pulse: PULSE_BANNER })} />);

    expect(
      screen.getByRole('option', { name: /Pulse — live/ })
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /^Web$/ })).toBeInTheDocument();
  });

  // --- Live preview ---
  it('previews the message as it is typed', async () => {
    const user = userEvent.setup();
    render(<SiteBannerForm snapshot={makeSnapshot()} />);

    expect(screen.getByText(/Write a message to see it here/)).toBeVisible();

    await user.type(screen.getByLabelText('Message'), 'Jira is degraded');

    expect(await findInPreview('Jira is degraded')).toBeVisible();
  });

  it('previews a draft even while the banner is switched off', async () => {
    const user = userEvent.setup();
    render(<SiteBannerForm snapshot={makeSnapshot()} />);

    await user.type(screen.getByLabelText('Message'), 'Not live yet');

    expect(await findInPreview('Not live yet')).toBeVisible();
    expect(screen.getByText(/Draft — saving now would hide/)).toBeVisible();
  });

  // --- Presets ---
  it('fills the form from a preset and switches the banner on', async () => {
    const user = userEvent.setup();
    render(<SiteBannerForm snapshot={makeSnapshot()} />);

    await user.click(screen.getByRole('button', { name: 'Degraded service' }));

    expect(screen.getByLabelText(/^Title/)).toHaveValue(
      'Service is experiencing issues'
    );
    expect(screen.getByLabelText('Style')).toHaveValue('error');
    expect(screen.getByLabelText('Show this banner')).toBeChecked();
  });

  // --- Saving ---
  it('posts the serialized announcement, escaping quotes for the admin', async () => {
    const user = userEvent.setup();
    const saved = makeSnapshot({ pulse: PULSE_BANNER });
    const fetchMock = mockSave(saved);

    render(<SiteBannerForm snapshot={makeSnapshot()} />);

    await user.selectOptions(screen.getByLabelText('Show on'), 'pulse');
    await user.type(
      screen.getByLabelText('Message'),
      'The "Find Dates" feature may not work.'
    );
    await user.click(screen.getByLabelText('Show this banner'));
    await user.click(screen.getByRole('button', { name: /Save banner/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const payload = lastPayload(fetchMock);
    expect(payload.target).toBe('pulse');
    expect(JSON.parse(payload.value)).toEqual({
      state: 'info',
      message: 'The "Find Dates" feature may not work.',
    });
    expect(toastSuccess).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it('refuses to save without a message', async () => {
    const user = userEvent.setup();
    const fetchMock = mockSave(makeSnapshot());

    render(<SiteBannerForm snapshot={makeSnapshot()} />);

    await user.click(screen.getByLabelText('Show this banner'));
    await user.click(screen.getByRole('button', { name: /Save banner/ }));

    expect(await screen.findByText('Message is required.')).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces a server error instead of claiming success', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Global Config request failed' }),
    }) as unknown as typeof fetch;

    render(<SiteBannerForm snapshot={makeSnapshot()} />);

    await user.type(screen.getByLabelText('Message'), 'Something');
    await user.click(screen.getByLabelText('Show this banner'));
    await user.click(screen.getByRole('button', { name: /Save banner/ }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Global Config request failed')
    );
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('reports an expired session rather than throwing on the login HTML', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    }) as unknown as typeof fetch;

    render(<SiteBannerForm snapshot={makeSnapshot()} />);

    await user.type(screen.getByLabelText('Message'), 'Something');
    await user.click(screen.getByLabelText('Show this banner'));
    await user.click(screen.getByRole('button', { name: /Save banner/ }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        expect.stringContaining('session has expired')
      )
    );
  });

  // --- Clearing ---
  it('offers Clear only for a target that has a live banner', async () => {
    const user = userEvent.setup();
    render(<SiteBannerForm snapshot={makeSnapshot({ pulse: PULSE_BANNER })} />);

    expect(
      screen.queryByRole('button', { name: 'Clear banner' })
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Show on'), 'pulse');

    expect(
      screen.getByRole('button', { name: 'Clear banner' })
    ).toBeInTheDocument();
  });

  it('posts an empty value when clearing is confirmed', async () => {
    const user = userEvent.setup();
    const fetchMock = mockSave(makeSnapshot());

    render(<SiteBannerForm snapshot={makeSnapshot({ pulse: PULSE_BANNER })} />);

    await user.selectOptions(screen.getByLabelText('Show on'), 'pulse');
    await user.click(screen.getByRole('button', { name: 'Clear banner' }));
    await user.click(screen.getByRole('button', { name: 'Clear it' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(lastPayload(fetchMock)).toEqual({ target: 'pulse', value: '' });
  });
});
