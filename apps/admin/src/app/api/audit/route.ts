import { NextRequest, NextResponse } from 'next/server';

import { apiFetch, ApiError } from '@/lib/api-fetch';
import { getIdToken, getUserFromSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idToken = (await getIdToken()) ?? '';
  const body = await request.json();

  try {
    const data = await apiFetch('/audit/search', { idToken, method: 'POST', body });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('audit proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
