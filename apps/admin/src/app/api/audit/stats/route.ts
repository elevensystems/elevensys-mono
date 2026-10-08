import { NextRequest, NextResponse } from 'next/server';

import { getAccessToken } from '@workspace/ui/lib/auth-server';

import { apiFetch, errorResponse } from '@/lib/api-fetch';
import { getUserFromSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = (await getAccessToken()) ?? '';
  const body = await request.json();

  try {
    const data = await apiFetch('/audit/stats', {
      accessToken,
      method: 'POST',
      body,
    });
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error, 'audit stats proxy error');
  }
}
