import type { Metadata } from 'next';
import { Ubuntu, Ubuntu_Mono } from 'next/font/google';

import { Toaster } from '@workspace/ui/components/sonner';

import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
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
  title: 'Admin',
  description: 'Admin Interface',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserFromSession();

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
            {children}
            <Toaster position="bottom-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
