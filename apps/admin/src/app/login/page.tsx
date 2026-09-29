import { redirect } from 'next/navigation';

import { SignInScreen } from '@workspace/ui/components/sign-in-screen';
import { Shield } from 'lucide-react';

import { appSidebarData } from '@/lib/app-sidebar-config';
import { getUserFromSession, hasStaffAccess } from '@/lib/auth';

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ error }, user] = await Promise.all([
    searchParams,
    getUserFromSession(),
  ]);

  if (hasStaffAccess(user)) redirect('/');

  return (
    <SignInScreen
      appName={appSidebarData.appName}
      icon={<Shield />}
      forbidden={error === 'forbidden'}
      forbiddenMessage="Your account isn't authorized for the admin console. Contact an administrator if you believe this is a mistake."
    />
  );
}
