import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { Button } from '@workspace/ui/components/button';
import type { AuthUser } from '@/types/auth';

import MainLayout from './main-layout';
import { ToolPageHeader } from './tool-page-header';

interface ProAccessOnlyProps {
  title: string;
  description: string;
  toolName?: string;
  message?: string;
  user?: AuthUser | null;
}

export default function ProAccessOnly({
  title,
  description,
  toolName,
  message,
  user,
}: ProAccessOnlyProps) {
  const isGuest = !user;
  const resolvedToolName = toolName || title;

  const resolvedTitle = isGuest ? 'Sign in required' : 'Pro access required';
  const resolvedMessage = isGuest
    ? `Please sign in to use ${resolvedToolName}.`
    : message ||
      `This tool is available to Pro users only. Upgrade your plan to unlock ${resolvedToolName}.`;

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <ToolPageHeader title={title} description={description} />
          <Alert className="border-dashed">
            <AlertTitle>{resolvedTitle}</AlertTitle>
            <AlertDescription>{resolvedMessage}</AlertDescription>
          </Alert>
          {isGuest && (
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
