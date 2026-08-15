import { NextRequest, NextResponse } from 'next/server';

import { JIRA_URLS } from '@/lib/api-urls';
import { sanitizeErrorText } from '@/lib/fetch-utils';
import { missingJiraInstanceResponse } from '@/lib/jira-proxy';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const body = await request.json();
    const { pid, startDate, endDate, username, jiraInstance } = body;

    if (!jiraInstance) {
      return missingJiraInstanceResponse();
    }

    if (!authHeader || !pid || !startDate || !endDate) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: Authorization header, pid, startDate, endDate',
        },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({ jiraInstance });

    const response = await fetch(
      `${JIRA_URLS.PROJECT_WORKLOGS_WARNING_ALL}?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        // An empty username asks for every user on the project.
        body: JSON.stringify({
          pid,
          startDate,
          endDate,
          username: username ?? '',
        }),
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
