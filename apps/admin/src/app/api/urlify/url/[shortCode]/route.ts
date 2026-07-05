import { NextRequest, NextResponse } from 'next/server';

import { ApiError, apiFetch } from '@/lib/api-fetch';
import { getAccessToken } from '@/lib/auth';

export const DELETE = async (
  _request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) => {
  const { shortCode } = await params;
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await apiFetch(`/urlify/url/${encodeURIComponent(shortCode)}`, {
      accessToken,
      method: 'DELETE',
    });
    return NextResponse.json(result ?? { success: true });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Urlify delete failed:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
};
