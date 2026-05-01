import { NextRequest, NextResponse } from 'next/server';

import { AUTOLOG_URLS } from '@/lib/api-urls';

interface RouteParams {
  params: Promise<{ configId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const response = await fetch(AUTOLOG_URLS.CONFIG(configId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { configId } = await params;
    const authHeader = request.headers.get('Authorization') || '';
    const username = request.nextUrl.searchParams.get('username');

    if (!authHeader || !username) {
      return NextResponse.json(
        { error: 'Missing Authorization header or username' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${AUTOLOG_URLS.CONFIG(configId)}?username=${encodeURIComponent(username)}`,
      {
        method: 'DELETE',
        headers: { Authorization: authHeader },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
