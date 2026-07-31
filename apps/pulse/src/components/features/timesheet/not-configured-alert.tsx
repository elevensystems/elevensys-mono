import { Banner } from '@workspace/ui/components/banner';

interface NotConfiguredAlertProps {
  isConfigured: boolean;
}

export function NotConfiguredAlert({ isConfigured }: NotConfiguredAlertProps) {
  if (isConfigured) return null;

  return (
    <Banner
      state="warning"
      title="Token not configured"
      message="Please configure your Jira token to enable timesheet features."
      action={{ label: 'Go to Configs', href: '/config' }}
    />
  );
}
