import { redirect } from 'next/navigation';

import { SignInScreen } from '@workspace/ui/components/sign-in-screen';
import { ChartPie } from 'lucide-react';

import { appSidebarData } from '@/lib/app-sidebar-config';
import { getUserFromSession, hasInsightAccess } from '@/lib/auth';

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ error }, user] = await Promise.all([
    searchParams,
    getUserFromSession(),
  ]);

  if (hasInsightAccess(user)) redirect('/');

  return (
    <SignInScreen
      appName={appSidebarData.appName}
      icon={<ChartPie />}
      forbidden={error === 'forbidden'}
      forbiddenMessage="Your account isn't authorized to view this dashboard. Contact an administrator if you believe this is a mistake."
    />
  );
}
