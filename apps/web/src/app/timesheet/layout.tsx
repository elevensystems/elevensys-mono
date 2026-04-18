import type { Metadata } from 'next';

export const metadata: Metadata = {
  icons: [
    {
      media: '(prefers-color-scheme: light)',
      url: '/jira-brands-dark.svg',
      href: '/jira-brands-dark.svg',
    },
    {
      media: '(prefers-color-scheme: dark)',
      url: '/jira-brands-light.svg',
      href: '/jira-brands-light.svg',
    },
  ],
};

export default function TimesheetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
