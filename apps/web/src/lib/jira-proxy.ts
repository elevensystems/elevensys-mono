import { NextRequest, NextResponse } from 'next/server';

export function getJiraInstanceFromQuery(request: NextRequest): string | null {
  return request.nextUrl.searchParams.get('jiraInstance');
}

export function missingJiraInstanceResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Missing required field: jiraInstance' },
    { status: 400 }
  );
}
