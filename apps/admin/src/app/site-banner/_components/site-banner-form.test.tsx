import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SiteAnnouncement } from '@workspace/ui/lib/site-announcement';

import { SiteBannerForm } from '@/app/site-banner/_components/site-banner-form';
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

const PULSE_BANNER: SiteAnnouncement = {
  id: 'pulse-1',
  state: 'warning',
  title: 'Jira DC is unstable',
  message: 'The "Find Dates" feature may not work.',
};

function makeSnapshot(
  values: SiteBannerSnapshot['values'] = {}
): SiteBannerSnapshot {
  return { values, history: [], configured: true };
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
  return JSON.parse(String(init.body)) as {
    target: string;
    id: string;
    announcement: SiteAnnouncement | null;
  };
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
    render(
      <SiteBannerForm snapshot={makeSnapshot({ pulse: [PULSE_BANNER] })} />
    );

    await user.selectOptions(screen.getByLabelText('Show on'), 'pulse');

    expect(screen.getByLabelText('Message')).toHaveValue(
      'The "Find Dates" feature may not work.'
    );
    expect(screen.getByLabelText(/^Title/)).toHaveValue('Jira DC is unstable');
    expect(screen.getByLabelText('Style')).toHaveValue('warning');
  });

  it('counts how many banners each target already has', () => {
    render(
      <SiteBannerForm
        snapshot={makeSnapshot({
          pulse: [PULSE_BANNER, { ...PULSE_BANNER, id: 'pulse-2' }],
        })}
      />
    );

    expect(
      screen.getByRole('option', { name: /Pulse — 2 live/ })
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
    const saved = makeSnapshot({ pulse: [PULSE_BANNER] });
    const fetchMock = mockSave(saved);

    render(<SiteBannerForm snapshot={makeSnapshot()} />);

    await user.selectOptions(screen.getByLabelText('Show on'), 'pulse');
    await user.type(
      screen.getByLabelText('Message'),
      'The "Find Dates" feature may not work.'
    );
    await user.click(screen.getByLabelText('Show this banner'));
    await user.click(screen.getByRole('button', { name: /Post banner/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const payload = lastPayload(fetchMock);
    expect(payload.target).toBe('pulse');
    expect(payload.announcement).toEqual({
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
    await user.click(screen.getByRole('button', { name: /Post banner/ }));

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
    await user.click(screen.getByRole('button', { name: /Post banner/ }));

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
    await user.click(screen.getByRole('button', { name: /Post banner/ }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        expect.stringContaining('session has expired')
      )
    );
  });

  it('does not loop when re-rendered with no banner saved', () => {
    // `useForm` re-applies its options every render, so anything unstable in
    // `toFormValues` drives "Maximum update depth exceeded".
    const { rerender } = render(<SiteBannerForm snapshot={makeSnapshot()} />);
    for (let i = 0; i < 30; i += 1) {
      rerender(<SiteBannerForm snapshot={makeSnapshot()} />);
    }

    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });

  // --- Managing several banners on one target ---
  it('lists every banner already posted for the selected target', async () => {
    const user = userEvent.setup();
    render(
      <SiteBannerForm
        snapshot={makeSnapshot({
          pulse: [
            PULSE_BANNER,
            { ...PULSE_BANNER, id: 'pulse-2', title: 'Second notice' },
          ],
        })}
      />
    );

    await user.selectOptions(screen.getByLabelText('Show on'), 'pulse');

    // Scoped to the list buttons: the open banner also shows in the preview.
    expect(
      screen.getByRole('button', { name: /Jira DC is unstable/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Second notice/ })
    ).toBeInTheDocument();
  });

  it('opens the banner that is clicked in the list', async () => {
    const user = userEvent.setup();
    render(
      <SiteBannerForm
        snapshot={makeSnapshot({
          pulse: [
            PULSE_BANNER,
            { ...PULSE_BANNER, id: 'pulse-2', title: 'Second notice' },
          ],
        })}
      />
    );

    await user.selectOptions(screen.getByLabelText('Show on'), 'pulse');
    await user.click(screen.getByRole('button', { name: /Second notice/ }));

    expect(screen.getByLabelText(/^Title/)).toHaveValue('Second notice');
  });

  it('posts a new banner under its own id, leaving the existing one alone', async () => {
    const user = userEvent.setup();
    const fetchMock = mockSave(makeSnapshot({ pulse: [PULSE_BANNER] }));

    render(
      <SiteBannerForm snapshot={makeSnapshot({ pulse: [PULSE_BANNER] })} />
    );

    await user.selectOptions(screen.getByLabelText('Show on'), 'pulse');
    await user.click(screen.getByRole('button', { name: 'Add banner' }));
    await user.type(screen.getByLabelText('Message'), 'A second notice.');
    await user.click(screen.getByLabelText('Show this banner'));
    await user.click(screen.getByRole('button', { name: /Post banner/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const payload = lastPayload(fetchMock);
    expect(payload.target).toBe('pulse');
    expect(payload.id).not.toBe(PULSE_BANNER.id);
    expect(payload.announcement?.message).toBe('A second notice.');
  });

  it('saves an existing banner under its own id, replacing it', async () => {
    const user = userEvent.setup();
    const fetchMock = mockSave(makeSnapshot({ pulse: [PULSE_BANNER] }));

    render(
      <SiteBannerForm snapshot={makeSnapshot({ pulse: [PULSE_BANNER] })} />
    );

    await user.selectOptions(screen.getByLabelText('Show on'), 'pulse');
    await user.click(screen.getByRole('button', { name: /Save banner/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(lastPayload(fetchMock).id).toBe('pulse-1');
  });

  // --- Deleting ---
  it('offers Delete only for a banner that has been posted', async () => {
    const user = userEvent.setup();
    render(
      <SiteBannerForm snapshot={makeSnapshot({ pulse: [PULSE_BANNER] })} />
    );

    expect(
      screen.queryByRole('button', { name: 'Delete banner' })
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Show on'), 'pulse');

    expect(
      screen.getByRole('button', { name: 'Delete banner' })
    ).toBeInTheDocument();

    // A fresh draft has nothing to delete yet.
    await user.click(screen.getByRole('button', { name: 'Add banner' }));
    expect(
      screen.queryByRole('button', { name: 'Delete banner' })
    ).not.toBeInTheDocument();
  });

  it('posts a null announcement for the chosen id when deletion is confirmed', async () => {
    const user = userEvent.setup();
    const fetchMock = mockSave(makeSnapshot());

    render(
      <SiteBannerForm snapshot={makeSnapshot({ pulse: [PULSE_BANNER] })} />
    );

    await user.selectOptions(screen.getByLabelText('Show on'), 'pulse');
    await user.click(screen.getByRole('button', { name: 'Delete banner' }));
    await user.click(screen.getByRole('button', { name: 'Delete it' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(lastPayload(fetchMock)).toEqual({
      target: 'pulse',
      id: 'pulse-1',
      announcement: null,
    });
  });
});
