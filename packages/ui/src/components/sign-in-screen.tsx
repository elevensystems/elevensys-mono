import * as React from 'react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@workspace/ui/components/alert';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { ShieldAlert } from 'lucide-react';

interface SignInScreenProps {
  appName: string;
  /** Icon shown in the brand mark above the card. */
  icon: React.ReactNode;
  /** The signed-in account is not in the group this app requires. */
  forbidden?: boolean;
  /** Explains who the app is for, shown when `forbidden`. */
  forbiddenMessage?: string;
}

/**
 * Sign-in screen for the Cognito-backed apps. Nothing redirects on its own:
 * the hosted login page opens only when the reader presses the button.
 *
 * A forbidden account still holds a Cognito session, so signing in again would
 * reuse it and land right back here. The forbidden state therefore routes
 * through `/api/auth/logout`, which ends that session and returns to `/login`.
 */
export function SignInScreen({
  appName,
  icon,
  forbidden = false,
  forbiddenMessage = 'Your account is not authorized for this app. Contact an administrator if you believe this is a mistake.',
}: SignInScreenProps) {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-lg [&>svg]:size-4">
            {icon}
          </div>
          {appName}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Sign in to {appName}</h1>
            </CardTitle>
            <CardDescription>
              You&apos;ll be redirected to the hosted login page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {forbidden && (
              <Alert variant="destructive">
                <ShieldAlert />
                <AlertTitle>Access denied</AlertTitle>
                <AlertDescription>{forbiddenMessage}</AlertDescription>
              </Alert>
            )}
            <Button asChild className="w-full">
              <a href={forbidden ? '/api/auth/logout' : '/api/auth/login'}>
                {forbidden
                  ? 'Sign in with a different account'
                  : 'Continue to sign in'}
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
