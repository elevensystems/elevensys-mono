import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { SiteAnnouncementProvider } from '@workspace/ui/components/site-announcement-provider';
import { SiteBanner } from '@workspace/ui/components/site-banner';

// The shared `SiteBanner` lives in `packages/ui`, which has no jest setup of
// its own — same arrangement as `src/lib/site-announcement.test.ts`.
describe('SiteBanner', () => {
  it('renders every announcement in the provider, in order', () => {
    render(
      <SiteAnnouncementProvider
        announcements={[
          { id: 'a', state: 'error', message: 'Outage' },
          { id: 'b', state: 'warning', message: 'Maintenance' },
          { id: 'c', state: 'info', message: 'New feature' },
        ]}
      >
        <SiteBanner />
      </SiteAnnouncementProvider>
    );

    const texts = Array.from(
      document.querySelectorAll('[data-slot="banner"]')
    ).map(n => n.textContent);
    expect(texts.length).toBe(3);
    expect(texts[0]).toContain('Outage');
    expect(texts[2]).toContain('New feature');
  });

  it('renders nothing when there are no announcements', () => {
    const { container } = render(
      <SiteAnnouncementProvider announcements={[]}>
        <SiteBanner />
      </SiteAnnouncementProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
