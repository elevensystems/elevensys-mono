import { NextRequest, NextResponse } from 'next/server';

import { TIMESHEET_URLS } from '@/lib/api-urls';
import { sanitizeErrorText } from '@/lib/fetch-utils';
import type { LogWorkRequest } from '@/types/timesheet';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const body: LogWorkRequest = await request.json();
    const { worklog, jiraInstance } = body;

    if (!authHeader || !worklog || !jiraInstance) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: Authorization header, worklog, and jiraInstance',
        },
        { status: 400 }
      );
    }

    if (!worklog.issueKey || !worklog.username || !worklog.startDate) {
      return NextResponse.json(
        { error: 'Missing required worklog fields' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({ jiraInstance });

    const response = await fetch(
      `${TIMESHEET_URLS.LOGWORK}?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(worklog),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: sanitizeErrorText(errorText, response.status) },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
