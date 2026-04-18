import { NextRequest, NextResponse } from 'next/server';

import { TIMESHEET_URLS } from '@/lib/api-urls';
import { sanitizeErrorText } from '@/lib/fetch-utils';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const body = await request.json();
    const { pid, startDate, endDate, jiraInstance } = body;

    if (!authHeader || !pid || !startDate || !endDate) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: Authorization header, pid, startDate, endDate',
        },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      jiraInstance: jiraInstance || 'jiradc',
    });

    const response = await fetch(
      `${TIMESHEET_URLS.WORKLOGS_WARNING}?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ pid, startDate, endDate }),
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
