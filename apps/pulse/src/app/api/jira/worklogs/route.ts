import { NextRequest, NextResponse } from 'next/server';

import { JIRA_URLS } from '@/lib/api-urls';
import { sanitizeErrorText } from '@/lib/fetch-utils';
import {
  getJiraInstanceFromQuery,
  missingJiraInstanceResponse,
} from '@/lib/jira-proxy';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const { searchParams } = request.nextUrl;

    const username = searchParams.get('username');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const jiraInstance = getJiraInstanceFromQuery(request);

    if (!jiraInstance) {
      return missingJiraInstanceResponse();
    }

    if (!authHeader || !username || !fromDate || !toDate) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: Authorization header, username, fromDate, toDate',
        },
        { status: 400 }
      );
    }

    const statusWorklog = searchParams.get('statusWorklog') ?? 'All';
    const params = new URLSearchParams({
      fromDate,
      toDate,
      user: username,
      statusWorklog,
      jiraInstance,
    });

    const response = await fetch(`${JIRA_URLS.WORKLOGS}?${params.toString()}`, {
      headers: { Authorization: authHeader },
    });

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
