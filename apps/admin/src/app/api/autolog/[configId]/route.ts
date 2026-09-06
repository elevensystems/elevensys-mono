import { NextRequest, NextResponse } from 'next/server';

import { ApiError, apiFetch } from '@/lib/api-fetch';
import { getAccessToken } from '@/lib/auth';

/**
 * Delete one user's autolog configuration.
 *
 * The backend keys configs by owner as well as id, so the owning username
 * travels with the request. It comes from the row being deleted rather than
 * from the staff member's own session — an admin is acting on someone else's
 * config.
 */
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) => {
  const { configId } = await params;
  const username = request.nextUrl.searchParams.get('username');
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!username) {
    return NextResponse.json({ error: 'Missing username' }, { status: 400 });
  }

  try {
    const result = await apiFetch(
      `/autolog/${encodeURIComponent(configId)}?username=${encodeURIComponent(username)}`,
      { accessToken, method: 'DELETE' }
    );
    return NextResponse.json(result ?? { success: true });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Autolog delete failed:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
};
