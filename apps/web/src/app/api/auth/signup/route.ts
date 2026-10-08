import { redirectToCognito } from '@workspace/ui/lib/auth-server';

import { authCookie, cognito } from '@/lib/auth';

export const GET = () => redirectToCognito(cognito, 'signup', authCookie);
