import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteBanner } from '@workspace/ui/components/site-banner';
import type { SiteAnnouncement } from '@workspace/ui/lib/site-announcement';

const OUTAGE: SiteAnnouncement = {
  id: 'outage',
  savedAt: '2026-09-05T09:00:00.000Z',
  state: 'error',
  message: 'Jira sync is down.',
};

const NOTICE: SiteAnnouncement = {
  id: 'notice',
  savedAt: '2026-09-05T09:00:00.000Z',
  state: 'info',
  message: 'Autolog now supports recurring configs.',
  dismissible: true,
};

/** The X on a banner, which only a dismissible one has. */
function dismissButtons() {
  return screen.queryAllByRole('button', { name: 'Dismiss' });
}

function messages() {
  return screen
    .queryAllByText(
      (_, element) => element?.getAttribute('data-slot') === 'banner-title'
    )
    .map(element => element.textContent);
}

describe('SiteBanner dismissal', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.resetModules();
  });

  it('offers no close button on a banner published without one', () => {
    render(<SiteBanner announcements={[OUTAGE]} />);
    expect(dismissButtons()).toHaveLength(0);
  });

  it('closes a dismissible banner and leaves the others up', async () => {
    const user = userEvent.setup();
    render(<SiteBanner announcements={[OUTAGE, NOTICE]} />);

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(messages()).toEqual([OUTAGE.message]);
  });

  it('keeps it closed on the next render, from what the browser stored', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SiteBanner announcements={[NOTICE]} />);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    unmount();

    render(<SiteBanner announcements={[NOTICE]} />);
    expect(messages()).toEqual([]);
  });

  it('brings the banner back once staff edit it', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SiteBanner announcements={[NOTICE]} />);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    unmount();

    // Same id, saved again: a new message readers have not seen yet.
    const edited = {
      ...NOTICE,
      message: 'Autolog is paused again.',
      savedAt: '2026-09-06T09:00:00.000Z',
    };
    render(<SiteBanner announcements={[edited]} />);
    expect(messages()).toEqual([edited.message]);
  });

  it('forgets banners that are no longer on screen', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SiteBanner announcements={[NOTICE]} />);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    unmount();

    const other: SiteAnnouncement = { ...NOTICE, id: 'other' };
    const second = render(<SiteBanner announcements={[other]} />);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    second.unmount();

    expect(
      JSON.parse(String(window.localStorage.getItem('site-banner-dismissed')))
    ).toEqual(['other@2026-09-05T09:00:00.000Z']);
  });

  it('shows the close button in a preview without acting on it', async () => {
    const user = userEvent.setup();
    render(<SiteBanner announcements={[NOTICE]} preview />);

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(messages()).toEqual([NOTICE.message]);
    expect(window.localStorage.getItem('site-banner-dismissed')).toBeNull();
  });
});
