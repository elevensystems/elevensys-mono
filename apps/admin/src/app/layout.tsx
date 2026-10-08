import type { Metadata } from 'next';
import { Merriweather, Ubuntu, Ubuntu_Mono } from 'next/font/google';

import { AuthProvider } from '@workspace/ui/components/auth-provider';
import { SiteAnnouncementProvider } from '@workspace/ui/components/site-announcement-provider';
import { Toaster } from '@workspace/ui/components/sonner';
import { ThemeProvider } from '@workspace/ui/components/theme-provider';
import { getSiteAnnouncements } from '@workspace/ui/lib/site-announcement-server';

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

const merriweather = Merriweather({
  subsets: ['latin'],
  variable: '--font-merriweather',
});

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Admin Interface',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserFromSession();
  const announcements = await getSiteAnnouncements('admin');

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
            <SiteAnnouncementProvider announcements={announcements}>
              {children}
              <Toaster position="top-center" />
            </SiteAnnouncementProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
