import { NextRequest, NextResponse } from 'next/server';

import { AUTOLOG_URLS } from '@/lib/api-urls';
import { internalErrorResponse } from '@/lib/jira-proxy';

interface RouteParams {
  params: Promise<{ configId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { configId } = await params;
    const authHeader = request.headers.get('Authorization') || '';
    const body = await request.json();

    if (!authHeader || !body.username) {
      return NextResponse.json(
        { error: 'Missing Authorization header or username' },
        { status: 400 }
      );
    }

    const response = await fetch(AUTOLOG_URLS.RUN(configId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
