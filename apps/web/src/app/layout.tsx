import type { Metadata } from 'next';
import { Merriweather, Ubuntu, Ubuntu_Mono } from 'next/font/google';

import { AuthProvider } from '@workspace/ui/components/auth-provider';
import { SiteAnnouncementProvider } from '@workspace/ui/components/site-announcement-provider';
import { Toaster } from '@workspace/ui/components/sonner';
import { ThemeProvider } from '@workspace/ui/components/theme-provider';
import { getSiteAnnouncements } from '@workspace/ui/lib/site-announcement-server';

import { VisibleToolsProvider } from '@/contexts/visible-tools-context';
import { getUserFromSession } from '@/lib/auth';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/constants';
import { getVisibleToolPaths } from '@/lib/sidebar-tools-server';
import '@/styles/globals.css';

const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-ubuntu',
});

const ubuntuMono = Ubuntu_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-ubuntu-mono',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  variable: '--font-merriweather',
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  icons: [
    {
      media: '(prefers-color-scheme: light)',
      url: '/diaspora-brands-dark.svg',
      href: '/diaspora-brands-dark.svg',
    },
    {
      media: '(prefers-color-scheme: dark)',
      url: '/diaspora-brands-light.svg',
      href: '/diaspora-brands-light.svg',
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserFromSession();
  const announcements = await getSiteAnnouncements('web');
  const visibleTools = await getVisibleToolPaths();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${ubuntu.variable} ${ubuntuMono.variable} ${merriweather.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider user={user}>
            <VisibleToolsProvider value={visibleTools}>
              <SiteAnnouncementProvider announcements={announcements}>
                {children}
                <Toaster position="top-center" />
              </SiteAnnouncementProvider>
            </VisibleToolsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
