import { NextRequest, NextResponse } from 'next/server';

import { JIRA_URLS } from '@/lib/api-urls';
import {
  getJiraInstanceFromQuery,
  internalErrorResponse,
  missingJiraInstanceResponse,
  upstreamErrorResponse,
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
      return upstreamErrorResponse(response);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
