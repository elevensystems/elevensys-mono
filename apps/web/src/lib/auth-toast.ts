import { toast } from 'sonner';

/**
 * Shows a consistent, actionable toast when a Jira API call fails due to an
 * expired or invalid token. The action navigates the user to the config page
 * to update their token.
 */
export function showAuthErrorToast(onUpdateToken: () => void): void {
  toast.error('Authentication failed — your token may have expired.', {
    action: {
      label: 'Update Token',
      onClick: onUpdateToken,
    },
    duration: 15000,
  });
}
