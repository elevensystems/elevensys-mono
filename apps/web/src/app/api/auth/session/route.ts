import { NextResponse } from 'next/server';

import { getUserFromSession } from '@/lib/auth';

// Returns non-sensitive user info derived from the id_token (server-only).
export const GET = async () => {
  const user = await getUserFromSession();
  return NextResponse.json({ user });
};
