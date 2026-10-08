import { NextRequest, NextResponse } from 'next/server';

import { sanitizeErrorText } from '@/lib/fetch-utils';

export function getJiraInstanceFromQuery(request: NextRequest): string | null {
  return request.nextUrl.searchParams.get('jiraInstance');
}

export function missingJiraInstanceResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Missing required field: jiraInstance' },
    { status: 400 }
  );
}

/** Relays a failed upstream response: its status, with a short user-safe message. */
export async function upstreamErrorResponse(
  response: Response
): Promise<NextResponse> {
  const errorText = await response.text();
  return NextResponse.json(
    { error: sanitizeErrorText(errorText, response.status) },
    { status: response.status }
  );
}

/** The 500 a proxy route answers with when it throws. */
export function internalErrorResponse(error: unknown): NextResponse {
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : 'Internal server error',
    },
    { status: 500 }
  );
}
