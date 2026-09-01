import type { Metadata } from 'next';
import { Ubuntu, Ubuntu_Mono } from 'next/font/google';

import { FlagsProvider } from '@workspace/ui/components/flags-provider';
import { Toaster } from '@workspace/ui/components/sonner';
import { resolveScheduledAnnouncement } from '@workspace/ui/lib/site-announcement';

import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { appSiteBannerFlag, siteBannerFlag } from '@/flags';
import { getUserFromSession } from '@/lib/auth';
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

export const metadata: Metadata = {
  title: 'Insight',
  description: 'Usage analytics dashboard',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserFromSession();
  // An app-specific announcement wins; an empty one falls back to the global.
  // The schedule window is applied here, server-side, rather than inside the
  // client `SiteBanner` — see resolveScheduledAnnouncement for why.
  const announcement =
    (await appSiteBannerFlag()) || (await siteBannerFlag()) || '';
  const flags = {
    'site-banner': resolveScheduledAnnouncement(String(announcement)),
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ubuntu.variable} ${ubuntuMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider user={user}>
            <FlagsProvider flags={flags}>
              {children}
              <Toaster position="bottom-right" />
            </FlagsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
