import { Banner } from '@workspace/ui/components/banner';

interface TokenExpiredAlertProps {
  authError: boolean;
}

export function TokenExpiredAlert({ authError }: TokenExpiredAlertProps) {
  if (!authError) return null;

  return (
    <Banner
      title="Token expired"
      state="warning"
      message="Your Jira token has expired or is no longer valid."
      action={{ label: 'Update Token', href: '/timesheet/config' }}
    />
  );
}
