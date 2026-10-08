import { NextRequest, NextResponse } from 'next/server';

import { getAccessToken } from '@workspace/ui/lib/auth-server';

import { apiFetch, errorResponse } from '@/lib/api-fetch';

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
    const result = await apiFetch(
      `/urlify/url/${encodeURIComponent(shortCode)}`,
      {
        accessToken,
        method: 'DELETE',
      }
    );
    return NextResponse.json(result ?? { success: true });
  } catch (err) {
    return errorResponse(err, 'Urlify delete failed', 'Delete failed');
  }
};
