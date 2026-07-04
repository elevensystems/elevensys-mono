import { NextResponse } from 'next/server';

import { getUserFromSession } from '@/lib/auth';

export const GET = async () => {
  const user = await getUserFromSession();
  return NextResponse.json({ user });
};
