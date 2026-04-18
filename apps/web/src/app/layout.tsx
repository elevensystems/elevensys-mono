import type { Metadata } from 'next';
import { Ubuntu, Ubuntu_Mono } from 'next/font/google';
import { headers } from 'next/headers';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@workspace/ui/components/sonner';
import { AuthProvider } from '@/contexts/auth-context';
import { DomainProvider } from '@/contexts/domain-context';
import { FlagsProvider } from '@/contexts/flags-context';
import { autologFlag, sidebarToolsFlag } from '@/flags';
import { getUserFromSession } from '@/lib/auth';
import {
  DEFAULT_TENANT,
  type TenantKey,
  getTenantConfig,
} from '@/lib/domain-config';
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

function resolveDomainConfig(headersList: Headers) {
  const tenant = (headersList.get('x-tenant') as TenantKey) ?? DEFAULT_TENANT;
  return getTenantConfig(tenant);
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const config = resolveDomainConfig(headersList);

  return {
    title: config.appName,
    description: config.description,
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
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const domainConfig = resolveDomainConfig(headersList);
  const user = await getUserFromSession();
  const flags = {
    autolog: Boolean(await autologFlag()),
    'sidebar-tools': String((await sidebarToolsFlag()) ?? ''),
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
          <DomainProvider config={domainConfig}>
            <AuthProvider user={user}>
              <FlagsProvider flags={flags}>
                {children}
                <Toaster position="top-right" />
              </FlagsProvider>
            </AuthProvider>
          </DomainProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
