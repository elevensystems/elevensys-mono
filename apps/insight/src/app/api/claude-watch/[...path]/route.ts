import { NextRequest, NextResponse } from 'next/server';

import { ApiError, apiFetch } from '@/lib/api-fetch';
import { getAccessToken, getUserFromSession } from '@/lib/auth';

/**
 * Read-only proxy to the claude-watch backend (`/claude-watch/*`).
 *
 * Keeps `API_BASE_URL` server-side and gates access to the insight group.
 * The incoming query string (from/to, sort, cursor, filters) is forwarded
 * verbatim to the matching backend endpoint.
 */
const BFF_PREFIX = '/api/claude-watch';

export async function GET(request: NextRequest) {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = (await getAccessToken()) ?? '';
  const backendPath = request.nextUrl.pathname.slice(BFF_PREFIX.length);
  const search = request.nextUrl.search;

  try {
    const data = await apiFetch(`/claude-watch${backendPath}${search}`, {
      accessToken,
      method: 'GET',
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error('claude-watch proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
