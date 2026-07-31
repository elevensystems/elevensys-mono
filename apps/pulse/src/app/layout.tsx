import type { Metadata } from 'next';
import { Ubuntu, Ubuntu_Mono } from 'next/font/google';

import { Toaster } from '@workspace/ui/components/sonner';

import { ThemeProvider } from '@/components/theme-provider';
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
  title: 'Jirassic World',
  description: 'Jira timesheet and worklog management',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ubuntu.variable} ${ubuntuMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
